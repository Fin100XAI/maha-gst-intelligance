"""Phase 6 acceptance: slot filling, maker-checker, DIN, and the audit chain."""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.audit.chain import verify_chain
from app.canonical import (
    ActionForm,
    Confidence,
    FinancialYear,
    FindingStatus,
    Period,
    RiskDimension,
    Severity,
)
from app.cases.demand import compute_demand
from app.db.models import Notice
from app.engine.params import ParameterSet
from app.engine.registry import Finding
from app.engine.trace import CalcKind, Tracer
from app.money import TaxVector
from app.notices.service import (
    ApprovalRefusedError,
    SlotLockedError,
    approve,
    draft,
    edit_narrative,
    mint_din,
    serve,
)
from app.notices.templates import TEMPLATES, SlotError, fill, template_for

PARAMS = ParameterSet()
AS_OF = date(2026, 9, 20)
AT = datetime(2026, 9, 20, 10, 30, tzinfo=UTC)
TAXPAYER = {"gstin": "27AAPFU0939F1ZV", "legal_name": "Umang Fabricators LLP"}


def _demand(fy: int = 2025, *, tax: str = "3842110") -> object:
    tracer = Tracer(CalcKind.RULE, "ITC-02", "snap-1", gstin=TAXPAYER["gstin"])
    tracer.note("rule", "ITC-02")
    finding = Finding(
        rule_id="ITC-02",
        status=FindingStatus.TRIGGERED,
        severity=Severity.HIGH,
        confidence=Confidence.CERTAIN,
        dimension=RiskDimension.CREDIT,
        title="ITC-02",
        legal_basis="Rule 37A CGST Rules, 2017",
        gstin=TAXPAYER["gstin"],
        period=Period(2025, 6),
        delta=TaxVector(igst=tax),
        interest=Decimal("120000"),
        trace=tracer.finish(result=None, formula_rendered="worked example"),
    )
    return compute_demand(
        [finding],
        gstin=TAXPAYER["gstin"],
        fy=FinancialYear(fy),
        as_of=AS_OF,
        params=PARAMS,
        snapshot_id="snap-1",
    )


# ---------------------------------------------------------------------------
# templates and slots
# ---------------------------------------------------------------------------


class TestSlots:
    def test_every_template_declares_its_slots_and_legal_basis(self) -> None:
        for template in TEMPLATES.values():
            assert template.legal_basis.strip()
            assert template.slots
            assert template.reply_days > 0

    @pytest.mark.golden
    def test_a_filled_notice_carries_every_figure_with_its_calc_id(self) -> None:
        demand = _demand()
        filled = fill(
            template_for(ActionForm.DRC_01A),
            demand=demand,
            taxpayer=TAXPAYER,
            narrative="Credit was availed from suppliers who did not discharge tax.",
        )
        assert "38,42,110.00" in filled.body
        for path, slot in filled.slots.items():
            assert slot["locked"] == "true"
            if path.startswith("demand."):
                assert slot["calc_id"] == demand.calc_id

    def test_a_notice_may_never_be_served_with_an_unresolved_slot(self) -> None:
        broken = template_for(ActionForm.ASMT_10)
        bad = type(broken)(
            form=broken.form,
            title=broken.title,
            language=broken.language,
            legal_basis=broken.legal_basis,
            body=broken.body + "\n{{slot:demand.invented}}",
            reply_days=broken.reply_days,
        )
        with pytest.raises(SlotError, match="does not resolve"):
            fill(bad, demand=_demand(), taxpayer=TAXPAYER, narrative="x")

    @pytest.mark.golden
    def test_a_narrative_may_not_smuggle_a_figure_into_a_locked_slot(self) -> None:
        """A drafted paragraph carrying slot syntax is refused, not rendered."""
        with pytest.raises(SlotError, match="narrative contains slot syntax"):
            fill(
                template_for(ActionForm.ASMT_10),
                demand=_demand(),
                taxpayer=TAXPAYER,
                narrative="The officer asserts {{slot:demand.total}} is understated.",
            )

    @pytest.mark.golden
    def test_the_total_is_the_tax_plus_interest_plus_penalty(self) -> None:
        filled = fill(
            template_for(ActionForm.ASMT_10),
            demand=_demand(),
            taxpayer=TAXPAYER,
            narrative="Discrepancy noticed.",
        )
        # 38,42,110 tax + 1,20,000 interest + nil penalty, rounded once under s.170.
        assert filled.slots["demand.total"]["value"] == "3962110.00"

    def test_money_renders_in_the_indian_system(self) -> None:
        filled = fill(
            template_for(ActionForm.DRC_01B),
            demand=_demand(),
            taxpayer=TAXPAYER,
            narrative="Difference noticed.",
        )
        assert filled.slots["demand.tax.igst"]["rendered"] == "38,42,110.00"

    def test_a_form_with_no_template_says_so(self) -> None:
        with pytest.raises(SlotError, match="not drafted yet"):
            template_for(ActionForm.ADT_02)

    def test_marathi_is_available_from_day_one(self) -> None:
        filled = fill(
            template_for(ActionForm.ASMT_10, "mr"),
            demand=_demand(),
            taxpayer=TAXPAYER,
            narrative="तफावत आढळली.",
        )
        assert "जीएसटीआयएन" in filled.body
        assert "38,42,110.00" in filled.body


# ---------------------------------------------------------------------------
# lifecycle
# ---------------------------------------------------------------------------


class TestLifecycle:
    def _draft(self, session: Session, **overrides: object) -> object:
        return draft(
            session,
            case_id="case-1",
            form=ActionForm.DRC_01A,
            demand=overrides.get("demand", _demand()),  # type: ignore[arg-type]
            taxpayer=TAXPAYER,
            narrative="Credit was availed from suppliers who did not discharge tax.",
            generated_by=str(overrides.get("generated_by", "sto.pune.4")),
            at=AT,
        )

    @pytest.mark.golden
    def test_self_approval_is_refused(self, session: Session) -> None:
        """Maker-checker is enforced here, so no UI path can bypass it."""
        drafted = self._draft(session)
        with pytest.raises(ApprovalRefusedError, match="may not approve"):
            approve(
                session,
                drafted.notice_id,  # type: ignore[attr-defined]
                approved_by="sto.pune.4",
                office_code="PUNEII",
                issued_on=date(2026, 9, 20),
                sequence=1,
                at=AT,
            )

    @pytest.mark.golden
    def test_a_different_officer_may_approve_and_a_din_is_minted(self, session: Session) -> None:
        drafted = self._draft(session)
        notice = approve(
            session,
            drafted.notice_id,  # type: ignore[attr-defined]
            approved_by="ac.pune",
            office_code="PUNEII",
            issued_on=date(2026, 9, 20),
            sequence=1,
            at=AT,
        )
        assert notice.status == "APPROVED"
        assert notice.din is not None
        assert notice.din.startswith("CBIC202609PUNEII")
        assert len(notice.din) <= 24

    def test_the_din_is_deterministic(self) -> None:
        first = mint_din(office_code="PUNEII", issued_on=date(2026, 9, 20), sequence=7)
        again = mint_din(office_code="PUNEII", issued_on=date(2026, 9, 20), sequence=7)
        other = mint_din(office_code="PUNEII", issued_on=date(2026, 9, 20), sequence=8)
        assert first == again
        assert first != other

    @pytest.mark.golden
    def test_the_approved_pdf_hash_enters_the_audit_chain(self, session: Session) -> None:
        """This is what lets the department prove in an appellate forum that the
        document served is the document approved."""
        drafted = self._draft(session)
        notice = approve(
            session,
            drafted.notice_id,  # type: ignore[attr-defined]
            approved_by="ac.pune",
            office_code="PUNEII",
            issued_on=date(2026, 9, 20),
            sequence=1,
            at=AT,
        )
        from sqlalchemy import select

        from app.db.models import AuditLog

        rows = session.execute(select(AuditLog).order_by(AuditLog.seq)).scalars().all()
        approval = next(row for row in rows if row.action == "NOTICE_APPROVE")
        # The hash of the document as approved is in the chain, readable, and
        # equal to the hash of the document the officer will serve.
        assert approval.detail["pdf_hash"] == notice.pdf_hash
        assert approval.detail["din"] == notice.din
        assert approval.after_hash is not None
        assert verify_chain(session).ok is True

    def test_editing_the_narrative_changes_the_document_hash(self, session: Session) -> None:
        drafted = self._draft(session)
        before = drafted.pdf_hash  # type: ignore[attr-defined]
        edited = edit_narrative(
            session,
            drafted.notice_id,  # type: ignore[attr-defined]
            narrative="Revised wording.",
            edited_by="sto.pune.4",
            at=AT,
        )
        assert edited.pdf_hash != before
        assert "Revised wording." in edited.filled.body

    def test_an_approved_notice_may_not_be_edited(self, session: Session) -> None:
        drafted = self._draft(session)
        approve(
            session,
            drafted.notice_id,
            approved_by="ac.pune",  # type: ignore[attr-defined]
            office_code="PUNEII",
            issued_on=date(2026, 9, 20),
            sequence=1,
            at=AT,
        )
        with pytest.raises(SlotLockedError, match="only a DRAFT"):
            edit_narrative(
                session,
                drafted.notice_id,
                narrative="late change",  # type: ignore[attr-defined]
                edited_by="sto.pune.4",
                at=AT,
            )

    def test_service_starts_the_reply_clock(self, session: Session) -> None:
        drafted = self._draft(session)
        approve(
            session,
            drafted.notice_id,
            approved_by="ac.pune",  # type: ignore[attr-defined]
            office_code="PUNEII",
            issued_on=date(2026, 9, 20),
            sequence=1,
            at=AT,
        )
        notice = serve(
            session,
            drafted.notice_id,  # type: ignore[attr-defined]
            served_by="ac.pune",
            service_mode="REGISTERED_POST",
            served_at=datetime(2026, 9, 25, tzinfo=UTC),
            at=AT,
        )
        assert notice.status == "SERVED"
        assert notice.reply_due == date(2026, 10, 25)

    def test_an_unapproved_notice_may_not_be_served(self, session: Session) -> None:
        drafted = self._draft(session)
        with pytest.raises(ApprovalRefusedError, match="only an APPROVED"):
            serve(
                session,
                drafted.notice_id,
                served_by="ac.pune",  # type: ignore[attr-defined]
                service_mode="EMAIL",
                served_at=datetime(2026, 9, 25, tzinfo=UTC),
                at=AT,
            )


# ---------------------------------------------------------------------------
# the refusals that protect credibility
# ---------------------------------------------------------------------------


class TestRefusals:
    @pytest.mark.golden
    def test_no_notice_may_issue_for_an_amnesty_period(self, session: Session) -> None:
        """Issuing a notice for a waived period is a credibility-destroying
        error and is trivially avoidable."""
        with pytest.raises(ApprovalRefusedError, match=r"s\.128A amnesty"):
            draft(
                session,
                case_id="case-2",
                form=ActionForm.DRC_01A,
                demand=_demand(2018),  # type: ignore[arg-type]
                taxpayer=TAXPAYER,
                narrative="x",
                generated_by="sto.pune.4",
                at=AT,
            )

    @pytest.mark.golden
    def test_no_notice_may_issue_once_limitation_has_expired(self, session: Session) -> None:
        expired = compute_demand(
            [],
            gstin=TAXPAYER["gstin"],
            fy=FinancialYear(2020),
            as_of=date(2030, 1, 1),
            params=PARAMS,
            snapshot_id="snap-1",
        )
        with pytest.raises(ApprovalRefusedError, match="limitation expired"):
            draft(
                session,
                case_id="case-3",
                form=ActionForm.DRC_01A,
                demand=expired,
                taxpayer=TAXPAYER,
                narrative="x",
                generated_by="sto.pune.4",
                at=AT,
            )

    def test_a_drafted_notice_is_recorded_even_before_approval(self, session: Session) -> None:
        drafted = draft(
            session,
            case_id="case-4",
            form=ActionForm.ASMT_10,
            demand=_demand(),  # type: ignore[arg-type]
            taxpayer=TAXPAYER,
            narrative="Discrepancy noticed.",
            generated_by="sto.pune.4",
            at=AT,
        )
        stored = session.get(Notice, drafted.notice_id)
        assert stored is not None
        assert stored.status == "DRAFT"
        assert stored.din is None
        assert stored.pdf_hash == drafted.pdf_hash
