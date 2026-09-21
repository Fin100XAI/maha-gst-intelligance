"""Statutory notice templates and slot filling.

Two rules govern this module, and both are enforced in code rather than in the
UI:

**Numeric slots bind only to finding fields.**  A slot names a path into the
demand build-up; it cannot carry a literal, and :func:`fill` refuses one.  The
model that drafts the narrative never sees slot syntax at all.

**The narrative is the only editable part.**  Everything numeric is locked and
visibly chained to its ``calc_id``, so the figure on the notice and the figure
in the drawer cannot diverge.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Final

from app.canonical import ActionForm
from app.cases.demand import DemandBuildUp
from app.money import inr

__all__ = ["TEMPLATES", "NoticeTemplate", "SlotError", "fill", "template_for"]

#: ``{{slot:path.to.value}}`` -- a path into the demand, never a literal.
_SLOT: Final[re.Pattern[str]] = re.compile(r"\{\{slot:([a-z0-9_.]+)\}\}")

#: ``{{narrative}}`` -- the one editable region.
_NARRATIVE: Final[str] = "{{narrative}}"


class SlotError(ValueError):
    """A slot did not resolve, or someone tried to put a literal in one."""


@dataclass(frozen=True, slots=True)
class NoticeTemplate:
    form: ActionForm
    title: str
    language: str
    legal_basis: str
    body: str
    reply_days: int
    #: What the officer must confirm before this form may issue.
    preconditions: tuple[str, ...] = ()

    @property
    def slots(self) -> tuple[str, ...]:
        return tuple(sorted(set(_SLOT.findall(self.body))))


_ASMT_10_EN = """\
FORM GST ASMT-10
Notice for intimating discrepancies in the return after scrutiny
[See rule 99(1)]

To
{{slot:taxpayer.legal_name}}
GSTIN {{slot:taxpayer.gstin}}

Tax period: {{slot:demand.fy}}
Reference: scrutiny under section 61 of the CGST Act, 2017

This is to inform you that during scrutiny of the return for the above tax
period, the following discrepancies have been noticed:

{{narrative}}

The tax, interest and any other amount payable in respect of such discrepancy
is as follows:

    Integrated tax      {{slot:demand.tax.igst}}
    Central tax         {{slot:demand.tax.cgst}}
    State/UT tax        {{slot:demand.tax.sgst}}
    Cess                {{slot:demand.tax.cess}}
    Interest            {{slot:demand.interest}}
    Penalty             {{slot:demand.penalty}}
    ---------------------------------------------
    Total               {{slot:demand.total}}

You are hereby directed to explain the reasons for the aforesaid discrepancies
within {{slot:notice.reply_days}} days of service of this notice, failing which
proceedings may be initiated under section 73 or section 74A, as applicable.
"""

_DRC_01A_EN = """\
FORM GST DRC-01A
Intimation of tax ascertained as being payable under section 74A(1)
[See rule 142(1A)]

To
{{slot:taxpayer.legal_name}}
GSTIN {{slot:taxpayer.gstin}}

Tax period: {{slot:demand.fy}}
Section applied: {{slot:demand.section}}

{{narrative}}

The amount ascertained as payable is:

    Integrated tax      {{slot:demand.tax.igst}}
    Central tax         {{slot:demand.tax.cgst}}
    State/UT tax        {{slot:demand.tax.sgst}}
    Cess                {{slot:demand.tax.cess}}
    Interest            {{slot:demand.interest}}
    Penalty             {{slot:demand.penalty}}
    ---------------------------------------------
    Total               {{slot:demand.total}}

You may pay the amount above and file Part B of this form. If you wish to file
any submission against the ascertainment, you may do so within
{{slot:notice.reply_days}} days.
"""

_DRC_01B_EN = """\
FORM GST DRC-01B
Intimation of difference in liability reported in the statement of outward
supplies and that reported in the return
[See rule 88C]

To
{{slot:taxpayer.legal_name}}
GSTIN {{slot:taxpayer.gstin}}

Tax period: {{slot:demand.fy}}

{{narrative}}

Difference in liability:

    Integrated tax      {{slot:demand.tax.igst}}
    Central tax         {{slot:demand.tax.cgst}}
    State/UT tax        {{slot:demand.tax.sgst}}
    Cess                {{slot:demand.tax.cess}}
    ---------------------------------------------
    Total               {{slot:demand.tax.total}}

You are advised to pay the differential liability along with interest under
section 50, or furnish a reply in Part B of this form, within
{{slot:notice.reply_days}} days. Failure to do so will block the filing of
your next statement of outward supplies under rule 59(6).
"""

_ASMT_10_MR = """\
फॉर्म जीएसटी ASMT-10
छाननीनंतर विवरणपत्रातील तफावतींची सूचना
[नियम 99(1) पाहा]

प्रति
{{slot:taxpayer.legal_name}}
जीएसटीआयएन {{slot:taxpayer.gstin}}

कर कालावधी: {{slot:demand.fy}}

{{narrative}}

देय रक्कम:

    एकीकृत कर        {{slot:demand.tax.igst}}
    केंद्रीय कर        {{slot:demand.tax.cgst}}
    राज्य कर           {{slot:demand.tax.sgst}}
    उपकर               {{slot:demand.tax.cess}}
    ---------------------------------------------
    एकूण               {{slot:demand.total}}

या सूचनेच्या बजावणीपासून {{slot:notice.reply_days}} दिवसांत खुलासा करावा.
"""


TEMPLATES: Final[dict[tuple[ActionForm, str], NoticeTemplate]] = {
    (ActionForm.ASMT_10, "en"): NoticeTemplate(
        form=ActionForm.ASMT_10,
        title="Notice for intimating discrepancies in the return after scrutiny",
        language="en",
        legal_basis="s.61 CGST Act, 2017 r/w Rule 99(1)",
        body=_ASMT_10_EN,
        reply_days=30,
        preconditions=("The findings relied on must be CERTAIN or STRONG.",),
    ),
    (ActionForm.ASMT_10, "mr"): NoticeTemplate(
        form=ActionForm.ASMT_10,
        title="छाननीनंतरची सूचना",
        language="mr",
        legal_basis="s.61 CGST Act, 2017 r/w Rule 99(1)",
        body=_ASMT_10_MR,
        reply_days=30,
    ),
    (ActionForm.DRC_01A, "en"): NoticeTemplate(
        form=ActionForm.DRC_01A,
        title="Intimation of tax ascertained as being payable",
        language="en",
        legal_basis="s.74A(1) CGST Act, 2017 r/w Rule 142(1A)",
        body=_DRC_01A_EN,
        reply_days=30,
        preconditions=(
            "The limitation clock must not have expired.",
            "The period must not be eligible for the s.128A amnesty.",
        ),
    ),
    (ActionForm.DRC_01B, "en"): NoticeTemplate(
        form=ActionForm.DRC_01B,
        title="Intimation of difference in liability",
        language="en",
        legal_basis="Rule 88C CGST Rules, 2017",
        body=_DRC_01B_EN,
        reply_days=7,
        preconditions=("Both Rule 88C limits must be crossed: above 20% AND above 25 lakh.",),
    ),
}


def template_for(form: ActionForm, language: str = "en") -> NoticeTemplate:
    try:
        return TEMPLATES[(form, language)]
    except KeyError as exc:
        available = sorted({lang for f, lang in TEMPLATES if f == form})
        raise SlotError(
            f"no {form.value} template in {language!r}"
            + (f"; available: {available}" if available else "; that form is not drafted yet")
        ) from exc


def _resolve(path: str, context: dict[str, Any]) -> Any:
    node: Any = context
    for part in path.split("."):
        if isinstance(node, dict):
            if part not in node:
                raise SlotError(f"slot {path!r} does not resolve: no {part!r}")
            node = node[part]
        else:
            if not hasattr(node, part):
                raise SlotError(f"slot {path!r} does not resolve: no attribute {part!r}")
            node = getattr(node, part)
    return node


@dataclass(frozen=True, slots=True)
class FilledNotice:
    form: str
    language: str
    legal_basis: str
    body: str
    reply_days: int
    #: Slot path -> the rendered value and the calc_id that backs it.
    slots: dict[str, dict[str, str]] = field(default_factory=dict)
    narrative: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "form": self.form,
            "language": self.language,
            "legal_basis": self.legal_basis,
            "body": self.body,
            "reply_days": self.reply_days,
            "slots": self.slots,
            "narrative": self.narrative,
        }


def fill(
    template: NoticeTemplate,
    *,
    demand: DemandBuildUp,
    taxpayer: dict[str, str],
    narrative: str,
) -> FilledNotice:
    """Render a notice.

    Every numeric slot resolves against the demand build-up, and every one
    carries the demand's ``calc_id`` so the figure on the served document and
    the figure in the provenance drawer are the same computation.

    A narrative that contains slot syntax is refused outright.  The drafting
    model is never shown slot syntax, so a narrative carrying it is either a
    prompt-injection attempt or a bug; either way it must not reach a served
    document.
    """
    if _SLOT.search(narrative) or _NARRATIVE in narrative:
        raise SlotError(
            "the narrative contains slot syntax; the narrative is prose only and "
            "may not introduce a figure into a locked slot"
        )

    context: dict[str, Any] = {
        "demand": {
            "fy": demand.fy,
            "section": demand.section,
            "tax": {
                "igst": demand.tax.igst,
                "cgst": demand.tax.cgst,
                "sgst": demand.tax.sgst,
                "cess": demand.tax.cess,
                "total": demand.tax.total,
            },
            "interest": demand.interest,
            "penalty": demand.penalty,
            "total": demand.total,
        },
        "taxpayer": taxpayer,
        "notice": {"reply_days": template.reply_days},
    }

    slots: dict[str, dict[str, str]] = {}

    def render(match: re.Match[str]) -> str:
        path = match.group(1)
        value = _resolve(path, context)
        shown = inr(value, symbol=False) if isinstance(value, Decimal) else str(value)
        slots[path] = {
            "value": format(value, "f") if isinstance(value, Decimal) else str(value),
            "rendered": shown,
            "calc_id": demand.calc_id if path.startswith("demand.") else "",
            "locked": "true",
        }
        return shown

    body = _SLOT.sub(render, template.body)
    body = body.replace(_NARRATIVE, narrative)

    # Nothing may remain unresolved: a notice with a visible {{slot:...}} is a
    # notice that must never be served.
    leftover = _SLOT.findall(body)
    if leftover:
        raise SlotError(f"unresolved slot(s) after filling: {sorted(set(leftover))}")

    return FilledNotice(
        form=template.form.value,
        language=template.language,
        legal_basis=template.legal_basis,
        body=body,
        reply_days=template.reply_days,
        slots=slots,
        narrative=narrative,
    )
