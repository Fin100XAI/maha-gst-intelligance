"""Gate G7 -- replay.

The same snapshot run twice must produce identical calc_ids, identical identity
results and identical ordering.  Everything downstream -- the provenance
drawer, a demand, an appellate submission -- rests on this.
"""

from __future__ import annotations

import ast
from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest

from app.canonical import Period
from app.engine.identities import evaluate_identities, identity_matrix, r1
from app.engine.params import ParameterNotConfiguredError, ParameterRow, ParameterSet
from app.engine.records import TaxpayerData
from app.engine.trace import CalcKind, Tracer, canonical_value
from app.money import TaxVector
from tests.engine import factories as f
from tests.engine.factories import JUN


def _populated() -> TaxpayerData:
    return f.data(
        outward=(
            f.outward(JUN, doc_no="INV-1", taxable="1000000", igst="180000"),
            f.outward(JUN, doc_no="INV-2", taxable="500000", cgst="45000", sgst="45000"),
        ),
        inward=(f.inward(JUN, igst="90000"),),
        returns_3b=(f.return_3b(JUN, t31a_igst="150000", t4a5_igst="90000"),),
        ledgers=(f.ledger(JUN, opening="100000", credited="50000", debited="30000"),),
        filings=(f.filing(JUN, due=date(2025, 7, 20), filed=date(2025, 7, 25)),),
    )


@pytest.mark.golden
def test_two_runs_over_one_snapshot_produce_identical_calc_ids() -> None:
    first = evaluate_identities(f.context(_populated()), JUN)
    second = evaluate_identities(f.context(_populated()), JUN)

    assert [r.calc_id for r in first] == [r.calc_id for r in second]
    assert [r.identity_id for r in first] == [r.identity_id for r in second]
    assert [r.status for r in first] == [r.status for r in second]
    assert [r.delta.dict() for r in first] == [r.delta.dict() for r in second]


@pytest.mark.golden
def test_the_whole_matrix_replays_identically() -> None:
    one = identity_matrix(f.context(_populated()))
    other = identity_matrix(f.context(_populated()))
    assert {p: [r.calc_id for r in rows] for p, rows in one.items()} == {
        p: [r.calc_id for r in rows] for p, rows in other.items()
    }


def test_a_calc_id_does_not_depend_on_the_engine_run_or_the_clock() -> None:
    """If it did, two runs over one snapshot would disagree, and the drawer
    would become a per-run artefact rather than a property of the computation."""
    early = r1(f.context(_populated(), as_of=date(2026, 1, 1)), JUN)
    late = r1(f.context(_populated(), as_of=date(2026, 12, 31)), JUN)
    assert early.calc_id == late.calc_id


def test_a_different_snapshot_gives_a_different_calc_id() -> None:
    one = r1(f.context(_populated(), snapshot_id="snap-a"), JUN)
    other = r1(f.context(_populated(), snapshot_id="snap-b"), JUN)
    assert one.calc_id != other.calc_id


def test_a_changed_input_changes_the_calc_id() -> None:
    base = f.data(
        outward=(f.outward(JUN, igst="180000"),),
        returns_3b=(f.return_3b(JUN, t31a_igst="150000"),),
    )
    changed = f.data(
        outward=(f.outward(JUN, igst="180001"),),
        returns_3b=(f.return_3b(JUN, t31a_igst="150000"),),
    )
    assert r1(f.context(base), JUN).calc_id != r1(f.context(changed), JUN).calc_id


def test_a_changed_threshold_changes_the_calc_id() -> None:
    """A drawer showing a new threshold under an old calc_id would misdescribe
    what was actually run."""
    with_parameter = Tracer(CalcKind.RULE, "OUT-01", "snap", gstin="27X")
    with_parameter.used_parameter(
        ParameterSet().get("OUT-01", "pct_threshold", on=date(2025, 6, 30)).use()
    )
    without = Tracer(CalcKind.RULE, "OUT-01", "snap", gstin="27X")
    assert with_parameter.calc_id() != without.calc_id()


def test_a_calc_id_is_a_sha256_not_a_uuid() -> None:
    calc_id = r1(f.context(_populated()), JUN).calc_id
    assert len(calc_id) == 64
    assert all(character in "0123456789abcdef" for character in calc_id)


def test_canonical_value_never_emits_a_float() -> None:
    payload = canonical_value(
        {"tax": TaxVector(igst="1.005"), "amount": Decimal("3.14159"), "when": date(2025, 6, 1)}
    )
    assert payload["amount"] == "3.14159"
    assert payload["tax"]["igst"] == "1.01"
    assert payload["when"] == "2025-06-01"


# ---------------------------------------------------------------------------
# purity: no clock, no randomness, no network inside the engine
# ---------------------------------------------------------------------------

ENGINE = Path(__file__).resolve().parent.parent.parent / "app" / "engine"

FORBIDDEN_CALLS = {
    ("date", "today"),
    ("datetime", "now"),
    ("datetime", "utcnow"),
    ("time", "time"),
}
FORBIDDEN_MODULES = {"random", "secrets", "requests", "httpx", "socket", "urllib", "uuid"}


@pytest.mark.golden
@pytest.mark.parametrize("module", sorted(p.name for p in ENGINE.glob("*.py")))
def test_no_engine_module_reads_the_clock_or_the_network(module: str) -> None:
    """``as_of`` is injected.  A rule calling date.today() is a build failure."""
    tree = ast.parse((ENGINE / module).read_text(encoding="utf-8"), filename=module)
    offences: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            value = node.func.value
            if isinstance(value, ast.Name) and (value.id, node.func.attr) in FORBIDDEN_CALLS:
                offences.append(f"{value.id}.{node.func.attr}() at line {node.lineno}")
        if isinstance(node, ast.Import):
            offences += [
                f"import {alias.name} at line {node.lineno}"
                for alias in node.names
                if alias.name.split(".")[0] in FORBIDDEN_MODULES
            ]
        if (
            isinstance(node, ast.ImportFrom)
            and node.module
            and node.module.split(".")[0] in FORBIDDEN_MODULES
        ):
            offences.append(f"from {node.module} import ... at line {node.lineno}")
    assert not offences, f"{module} is impure: {offences}"


# ---------------------------------------------------------------------------
# effective-dated parameter resolution
# ---------------------------------------------------------------------------


class TestPeriodAwareParameters:
    @pytest.mark.golden
    def test_a_parameter_resolves_as_at_the_tax_period_not_as_at_today(self) -> None:
        """Scrutinising FY 2019-20 applies FY 2019-20 thresholds, even after a
        2026 change.  Changing a parameter never rewrites history."""
        rows = [
            ParameterRow("OUT-01", "pct_threshold", "10", date(2017, 7, 1), date(2025, 12, 31)),
            ParameterRow("OUT-01", "pct_threshold", "20", date(2026, 1, 1)),
        ]
        params = ParameterSet(rows)
        assert params.get("OUT-01", "pct_threshold", on=Period(2019, 6)).decimal == Decimal("10")
        assert params.get("OUT-01", "pct_threshold", on=Period(2026, 6)).decimal == Decimal("20")

    def test_an_unconfigured_parameter_raises_rather_than_defaulting(self) -> None:
        with pytest.raises(ParameterNotConfiguredError) as caught:
            ParameterSet().get("OUT-01", "invented_key", on=date(2025, 6, 30))
        assert "TODO(statute)" in str(caught.value)

    def test_every_default_ships_provisional_until_the_law_officer_signs(self) -> None:
        params = ParameterSet()
        assert len(params.unapproved()) == len(params.all_rows())

    def test_the_parameter_use_carries_its_effective_date_into_the_drawer(self) -> None:
        use = ParameterSet().get("ITC-02", "supplier_3b_cutoff", on=date(2025, 6, 30)).use()
        assert use.value == "30-09"
        assert use.effective_from == date(2017, 7, 1)
        assert use.provisional is True
