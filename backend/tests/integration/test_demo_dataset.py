"""The synthetic demonstration dataset, asserted exactly.

Money is compared **as strings, to the paisa**, never with a float tolerance.
A tolerance here would hide precisely the class of bug the architecture exists
to prevent.

This file also records, honestly, the gap between what the generator produces
and what docs/04 says each profile should fire: the rules that need GSTR-2B,
e-way bills, ledgers or supplier filing status report NOT_EVALUATED, because
the generator does not yet emit those datasets.  That gap is stated rather than
papered over -- see ``test_the_unproduced_datasets_are_reported_honestly``.
"""

from __future__ import annotations

from collections.abc import Iterator
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.facts import FactParamIncidence
from app.db.models import Finding, OutwardLine, QuarantineRow, RiskScore, Taxpayer, Upload
from app.seed.demo import seed
from app.seed.synthetic import PROFILES

#: What the seeded run actually produces today, per profile.  Every entry is a
#: rule that fired on real ingested rows with real provenance.
EXPECTED_TRIGGERED: dict[int, set[str]] = {
    1: set(),  # the control
    2: {"OUT-01", "PAY-02", "PAY-04", "ITC-16"},
    3: {"ITC-07", "ITC-16"},
    4: {"ITC-16"},
    5: {"ITC-16"},
    6: set(),
    7: {"EIN-01"},
    8: {"EIN-02"},
    9: set(),
    10: set(),
    11: {"REG-06"},
    12: {"BEH-08", "PAY-02", "PAY-04", "REG-07"},
}

#: Datasets the generator does not yet emit.  Every rule that needs one of
#: these reports NOT_EVALUATED naming it, which is why several docs/04 target
#: findings are absent above.
UNPRODUCED_DATASETS: set[str] = {
    "gstr2b",
    "eway_bill",
    "ledgers",
    "supplier_filing_status",
}


@pytest.fixture(scope="module")
def seeded() -> Iterator[Session]:
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)
    with factory() as session:
        seed(session)
        yield session
    engine.dispose()


def _by_number(number: int) -> str:
    return next(p.gstin for p in PROFILES if p.number == number)


# ---------------------------------------------------------------------------
# the control
# ---------------------------------------------------------------------------


@pytest.mark.golden
def test_the_control_taxpayer_fires_nothing(seeded: Session) -> None:
    """A platform that cannot show a clean taxpayer cannot be trusted on a
    dirty one."""
    control = _by_number(1)
    triggered = (
        seeded.execute(
            select(Finding.rule_id).where(Finding.gstin == control, Finding.status == "TRIGGERED")
        )
        .scalars()
        .all()
    )
    assert triggered == [], f"the control fired: {sorted(set(triggered))}"


def test_the_control_still_had_every_rule_run_against_it(seeded: Session) -> None:
    """Firing nothing is not the same as not being examined.  The control must
    carry a CLEAR or NOT_EVALUATED finding for every rule."""
    control = _by_number(1)
    rules = seeded.execute(select(Finding.rule_id).where(Finding.gstin == control)).scalars().all()
    assert len(set(rules)) == 57


# ---------------------------------------------------------------------------
# every profile, exactly
# ---------------------------------------------------------------------------


@pytest.mark.golden
@pytest.mark.parametrize("number", sorted(EXPECTED_TRIGGERED))
def test_each_profile_fires_exactly_what_is_expected(seeded: Session, number: int) -> None:
    gstin = _by_number(number)
    fired = set(
        seeded.execute(
            select(Finding.rule_id).where(Finding.gstin == gstin, Finding.status == "TRIGGERED")
        )
        .scalars()
        .all()
    )
    assert fired == EXPECTED_TRIGGERED[number]


def test_the_unproduced_datasets_are_reported_honestly(seeded: Session) -> None:
    """The rules that do not fire say why, and name the dataset they lack.

    docs/04 expects profile 5 to fire ITC-02 (Rule 37A).  It does not, because
    the generator emits no supplier filing status -- and the platform says so
    rather than reporting 'no issue found'.
    """
    gstin = _by_number(5)
    rows = seeded.execute(
        select(Finding.rule_id, Finding.missing_inputs).where(
            Finding.gstin == gstin,
            Finding.rule_id == "ITC-02",
            Finding.status == "NOT_EVALUATED",
        )
    ).all()
    assert rows, "ITC-02 must be reported, not silently absent"
    missing = set(rows[0][1])
    assert missing & UNPRODUCED_DATASETS
    assert "supplier_filing_status" in missing


def test_no_rule_reports_clear_when_its_data_is_missing(seeded: Session) -> None:
    """Law 5: never 'no issue found' when a rule could not run."""
    offenders = seeded.execute(
        select(Finding.rule_id, func.count())
        .where(Finding.status == "NOT_EVALUATED", Finding.missing_inputs == [])
        .group_by(Finding.rule_id)
    ).all()
    assert offenders == []


# ---------------------------------------------------------------------------
# ingestion: the row identity, on real workbooks
# ---------------------------------------------------------------------------


@pytest.mark.golden
def test_every_upload_reconciles(seeded: Session) -> None:
    uploads = seeded.execute(select(Upload)).scalars().all()
    assert len(uploads) == len(PROFILES)
    for upload in uploads:
        assert upload.rows_in == (
            upload.rows_parsed + upload.rows_quarantined + upload.rows_duplicate
        ), upload.filename


def test_the_trailing_totals_rows_are_quarantined_not_ingested(seeded: Session) -> None:
    """A portal export ends each sheet with a Total row; it is not a transaction."""
    reasons = dict(
        seeded.execute(
            select(QuarantineRow.reason_code, func.count()).group_by(QuarantineRow.reason_code)
        ).all()
    )
    assert reasons.get("TOTALS_ROW", 0) > 0
    # And nothing was quarantined for a reason nobody stated.
    for row in seeded.execute(select(QuarantineRow)).scalars():
        assert row.reason and row.reason_code
        assert row.original_cells


def test_every_canonical_row_has_provenance(seeded: Session) -> None:
    rows = seeded.execute(select(OutwardLine)).scalars().all()
    assert rows
    assert all(row.prov_id for row in rows)


# ---------------------------------------------------------------------------
# money, compared as strings
# ---------------------------------------------------------------------------


@pytest.mark.golden
def test_money_is_compared_as_strings_to_the_paisa(seeded: Session) -> None:
    """A float tolerance here would hide the exact class of bug the
    architecture exists to prevent."""
    row = (
        seeded.execute(
            select(Finding).where(
                Finding.gstin == _by_number(2),
                Finding.rule_id == "OUT-01",
                Finding.status == "TRIGGERED",
            )
        )
        .scalars()
        .first()
    )
    assert row is not None
    shortfall = Decimal(row.delta_igst) + Decimal(row.delta_cgst) + Decimal(row.delta_sgst)
    # 12% of the declared outward tax, to the paisa.
    assert format(shortfall, "f") == format(shortfall.quantize(Decimal("0.01")), "f")
    assert row.calc_id
    assert row.formula_rendered


def test_out01_on_profile_two_routes_to_asmt_10_not_drc_01b(seeded: Session) -> None:
    """A 12% shortfall is below the Rule 88C limits, so the route is s.61
    scrutiny, not an intimation."""
    rows = (
        seeded.execute(
            select(Finding).where(
                Finding.gstin == _by_number(2),
                Finding.rule_id == "OUT-01",
                Finding.status == "TRIGGERED",
            )
        )
        .scalars()
        .all()
    )
    assert rows
    assert {row.suggested_form for row in rows} == {"ASMT-10"}


# ---------------------------------------------------------------------------
# scores and coverage
# ---------------------------------------------------------------------------


def test_every_taxpayer_has_both_scores_and_a_coverage(seeded: Session) -> None:
    scores = seeded.execute(select(RiskScore)).scalars().all()
    assert len(scores) == len(PROFILES)
    for score in scores:
        assert score.p_score is not None
        assert score.f_score is not None
        assert score.p_coverage is not None
        assert score.p_band and score.f_band
        assert score.p_calc_id and score.f_calc_id


@pytest.mark.golden
def test_the_ten_external_parameters_are_dark_for_every_taxpayer(seeded: Session) -> None:
    dark = dict(
        seeded.execute(
            select(FactParamIncidence.param_id, FactParamIncidence.external_feed).where(
                FactParamIncidence.flag == -1, FactParamIncidence.external_feed.isnot(None)
            )
        ).all()
    )
    assert set(dark) == {"P02", "P15", "P20", "P23", "P25", "P26", "P27", "P28", "P33", "P34"}
    assert set(dark.values()) == {
        "ICEGATE customs",
        "ITD / AIS turnover",
        "DGARM red-flag feed",
        "Refund module",
    }


def test_the_taxpayer_registry_is_populated(seeded: Session) -> None:
    taxpayers = seeded.execute(select(Taxpayer)).scalars().all()
    assert len(taxpayers) == len(PROFILES)
    assert all(row.state_code == "27" for row in taxpayers)
    assert {row.division for row in taxpayers} == {p.division for p in PROFILES}


class TestReconciliationMatrix:
    """Identities now run in the demo, so the matrix is real."""

    def test_every_taxpayer_and_period_has_all_eleven_identities(self, seeded: Session) -> None:
        from app.db.models import IdentityCheck

        rows = seeded.execute(select(IdentityCheck)).scalars().all()
        assert rows, "the demo run recorded no identity at all"

        by_subject: dict[tuple[str, str], set[str]] = {}
        for row in rows:
            by_subject.setdefault((row.gstin, row.period or ""), set()).add(row.identity_id)

        expected = {f"R{n}" for n in range(1, 12)}
        for key, found in by_subject.items():
            assert found == expected, f"{key} has {sorted(found)}"

    def test_an_unevaluable_identity_names_its_missing_dataset(self, seeded: Session) -> None:
        """R2 needs GSTR-2B, which the generator does not emit. It must say so
        rather than reporting a reconciliation that passed."""
        from app.db.models import IdentityCheck

        rows = (
            seeded.execute(select(IdentityCheck).where(IdentityCheck.status == "NOT_EVALUATED"))
            .scalars()
            .all()
        )
        assert rows
        for row in rows:
            assert row.missing_inputs, f"{row.identity_id} is NOT_EVALUATED with no reason"

    def test_no_identity_is_silently_absent(self, seeded: Session) -> None:
        from app.db.models import IdentityCheck

        statuses = {row.status for row in seeded.execute(select(IdentityCheck)).scalars().all()}
        assert statuses <= {"HOLDS", "BREACHED", "NOT_EVALUATED"}
        assert "NOT_EVALUATED" in statuses
