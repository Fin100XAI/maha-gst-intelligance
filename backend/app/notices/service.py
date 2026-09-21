"""Notice lifecycle: draft, maker-checker approval, DIN, service.

Two constraints are enforced **at the API and in this module**, not hidden in
the UI:

* **Maker-checker.**  The officer who generated a notice may not approve it.
  Self-approval is refused here, so a UI bug cannot produce one.
* **The approved PDF's hash enters the audit chain at approval.**  That is what
  lets the department prove in an appellate forum that the document served is
  the document that was approved.

A numeric slot cannot be edited after drafting.  :func:`edit_narrative` changes
only the narrative; anything else raises.
"""

from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Final

from sqlalchemy.orm import Session

from app.audit.chain import append as audit_append
from app.canonical import ActionForm
from app.cases.demand import DemandBuildUp
from app.db.models import Notice
from app.notices.templates import FilledNotice, fill, template_for

__all__ = [
    "ApprovalRefusedError",
    "SlotLockedError",
    "approve",
    "draft",
    "edit_narrative",
    "mint_din",
    "serve",
]

#: DIN format per CBIC Circular 122/41/2019: a 20-character alphanumeric
#: reference carrying the year, the month and the issuing office.
_DIN_PREFIX: Final[str] = "CBIC"


class ApprovalRefusedError(PermissionError):
    """Maker-checker: the generator may not approve their own notice."""


class SlotLockedError(PermissionError):
    """An attempt to edit a numeric slot after drafting."""


def _new_id() -> str:
    return str(uuid.uuid4())


def mint_din(*, office_code: str, issued_on: date, sequence: int) -> str:
    """A Document Identification Number, verifiable from the public page.

    Deterministic in its inputs, so the same notice minted twice yields the
    same DIN rather than two competing references to one document.
    """
    body = f"{issued_on:%Y%m}{office_code.upper()[:6]}{sequence:06d}"
    checksum = hashlib.sha256(body.encode("utf-8")).hexdigest()[:4].upper()
    return f"{_DIN_PREFIX}{body}{checksum}"[:24]


@dataclass(frozen=True, slots=True)
class DraftedNotice:
    notice_id: str
    filled: FilledNotice
    pdf_hash: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "notice_id": self.notice_id,
            "pdf_hash": self.pdf_hash,
            **self.filled.as_dict(),
        }


def _document_hash(filled: FilledNotice) -> str:
    """The hash of the document as it stands.

    Computed over the rendered body **and** every slot value, so changing a
    figure changes the hash even if the prose is untouched.
    """
    material = (
        filled.body
        + "|"
        + "|".join(f"{path}={slot['value']}" for path, slot in sorted(filled.slots.items()))
    )
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def draft(
    session: Session,
    *,
    case_id: str,
    form: ActionForm,
    demand: DemandBuildUp,
    taxpayer: dict[str, str],
    narrative: str,
    generated_by: str,
    language: str = "en",
    at: datetime | None = None,
) -> DraftedNotice:
    """Fill a template and record the draft.

    Refuses to draft at all when the limitation clock has expired or the
    period is under the s.128A amnesty: a notice for a waived period is a
    credibility-destroying error, and it is trivially avoidable.
    """
    # Amnesty is tested first.  For every year s.128A covers the limitation
    # clock has also run, and the waiver is the substantive reason the notice
    # must not issue -- an officer told only "limitation expired" would go
    # looking for an extension that does not exist.
    if demand.amnesty:
        raise ApprovalRefusedError(
            f"FY {demand.fy} is eligible for the s.128A amnesty and is suppressed from the "
            "enforcement queue"
        )
    if demand.limitation.expired:
        raise ApprovalRefusedError(
            f"limitation expired on {demand.limitation.order_deadline}: no notice may issue"
        )

    template = template_for(form, language)
    filled = fill(template, demand=demand, taxpayer=taxpayer, narrative=narrative)
    pdf_hash = _document_hash(filled)

    notice = Notice(
        id=_new_id(),
        case_id=case_id,
        form=form.value,
        language=language,
        body_json=filled.as_dict(),
        pdf_hash=pdf_hash,
        status="DRAFT",
        generated_by=generated_by,
        reply_due=None,
    )
    session.add(notice)
    audit_append(
        session,
        actor=generated_by,
        action="NOTICE_DRAFT",
        entity="notice",
        entity_id=notice.id,
        after={"form": form.value, "pdf_hash": pdf_hash, "calc_id": demand.calc_id},
        # `after` is hashed, not stored.  The document hash is repeated in
        # `detail`, which is stored in the clear and covered by the chain hash,
        # so the proof reads directly rather than by recomputation.
        detail={"form": form.value, "pdf_hash": pdf_hash, "calc_id": demand.calc_id},
        at=at,
    )
    session.flush()
    return DraftedNotice(notice_id=notice.id, filled=filled, pdf_hash=pdf_hash)


def edit_narrative(
    session: Session,
    notice_id: str,
    *,
    narrative: str,
    edited_by: str,
    at: datetime | None = None,
) -> DraftedNotice:
    """Replace the narrative paragraph.  Numeric slots are untouched.

    The narrative may be agent-drafted, and it is badged
    ``AI-DRAFTED -- OFFICER RESPONSIBLE`` on screen; the officer who edits it
    owns it either way.
    """
    notice = session.get(Notice, notice_id)
    if notice is None:
        raise LookupError(f"no notice {notice_id!r}")
    if notice.status != "DRAFT":
        raise SlotLockedError(f"notice is {notice.status}; only a DRAFT may be edited")

    body = dict(notice.body_json)
    previous = body.get("narrative", "")
    # Rebuild the rendered body by swapping only the narrative region.
    body["body"] = str(body["body"]).replace(previous, narrative) if previous else body["body"]
    body["narrative"] = narrative
    notice.body_json = body

    filled = FilledNotice(
        form=str(body["form"]),
        language=str(body["language"]),
        legal_basis=str(body["legal_basis"]),
        body=str(body["body"]),
        reply_days=int(body["reply_days"]),
        slots=dict(body["slots"]),
        narrative=narrative,
    )
    notice.pdf_hash = _document_hash(filled)

    audit_append(
        session,
        actor=edited_by,
        action="NOTICE_EDIT_NARRATIVE",
        entity="notice",
        entity_id=notice.id,
        before={"narrative": previous},
        after={"narrative": narrative, "pdf_hash": notice.pdf_hash},
        detail={"pdf_hash": notice.pdf_hash},
        at=at,
    )
    session.flush()
    return DraftedNotice(notice_id=notice.id, filled=filled, pdf_hash=notice.pdf_hash)


def approve(
    session: Session,
    notice_id: str,
    *,
    approved_by: str,
    office_code: str,
    issued_on: date,
    sequence: int,
    at: datetime | None = None,
) -> Notice:
    """Maker-checker approval, which mints the DIN and chains the PDF hash.

    The approver must differ from the generator.  That is refused here, so no
    UI path -- and no API caller -- can produce a self-approved notice.
    """
    notice = session.get(Notice, notice_id)
    if notice is None:
        raise LookupError(f"no notice {notice_id!r}")
    if notice.status != "DRAFT":
        raise ApprovalRefusedError(f"notice is already {notice.status}")
    if notice.generated_by == approved_by:
        raise ApprovalRefusedError(
            "maker-checker: the officer who generated this notice may not approve it"
        )

    notice.approved_by = approved_by
    notice.approved_at = at or datetime.now().astimezone()
    notice.din = mint_din(office_code=office_code, issued_on=issued_on, sequence=sequence)
    notice.status = "APPROVED"

    # The approved document's hash enters the chain here, and nowhere else.
    audit_append(
        session,
        actor=approved_by,
        action="NOTICE_APPROVE",
        entity="notice",
        entity_id=notice.id,
        before={"status": "DRAFT"},
        after={"status": "APPROVED", "din": notice.din, "pdf_hash": notice.pdf_hash},
        # This is the record an appellate forum reads: the hash of the document
        # as approved, committed to by the chain at the moment of approval.
        detail={"din": notice.din, "pdf_hash": notice.pdf_hash, "form": notice.form},
        at=at,
    )
    session.flush()
    return notice


def serve(
    session: Session,
    notice_id: str,
    *,
    served_by: str,
    service_mode: str,
    served_at: datetime,
    at: datetime | None = None,
) -> Notice:
    """Record service, and start the reply clock."""
    notice = session.get(Notice, notice_id)
    if notice is None:
        raise LookupError(f"no notice {notice_id!r}")
    if notice.status != "APPROVED":
        raise ApprovalRefusedError(
            f"notice is {notice.status}; only an APPROVED notice may be served"
        )

    reply_days = int(notice.body_json.get("reply_days", 30))
    notice.served_at = served_at
    notice.service_mode = service_mode
    notice.reply_due = date.fromordinal(served_at.date().toordinal() + reply_days)
    notice.status = "SERVED"

    audit_append(
        session,
        actor=served_by,
        action="NOTICE_SERVE",
        entity="notice",
        entity_id=notice.id,
        after={
            "service_mode": service_mode,
            "served_at": served_at,
            "reply_due": notice.reply_due,
            "pdf_hash": notice.pdf_hash,
        },
        detail={
            "din": notice.din,
            "pdf_hash": notice.pdf_hash,
            "service_mode": service_mode,
            "reply_due": notice.reply_due.isoformat() if notice.reply_due else None,
        },
        at=at,
    )
    session.flush()
    return notice
