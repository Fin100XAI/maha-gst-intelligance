"""Gate G1 -- the no-float lint, and proof that it actually fails.

A guard nobody has watched fail is a guard nobody knows works.  Half of this
file exists to violate G1 on purpose and assert that the build breaks.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

from tools.lint_no_float import GUARDED, main, scan_source

PROBE = Path("app/engine/_probe.py")


# ---------------------------------------------------------------------------
# the real trees stay clean
# ---------------------------------------------------------------------------


@pytest.mark.golden
def test_the_guarded_trees_are_clean(backend_root: Path) -> None:
    assert main([str(backend_root / tree) for tree in GUARDED]) == 0


def test_money_and_canonical_hold_no_float_literals(backend_root: Path) -> None:
    """These are outside the guarded trees, but a float in either would defeat
    the guard from below."""
    for module in ("app/money.py", "app/canonical.py"):
        source = (backend_root / module).read_text(encoding="utf-8")
        violations = [v for v in scan_source(source, Path(module)) if v.code == "G1-LITERAL"]
        assert not violations, [v.render(backend_root) for v in violations]


# ---------------------------------------------------------------------------
# it catches what it claims to catch
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("source", "code"),
    [
        ("RATE = 0.18", "G1-LITERAL"),
        ("x = 1e5", "G1-LITERAL"),
        ("def f(a=2.5): pass", "G1-LITERAL"),
        ("z = 1 + 2j", "G1-LITERAL"),
        ("y = float(x)", "G1-CALL"),
        ("y = np.float64(x)", "G1-CALL"),
        ("y = numpy.longdouble(x)", "G1-CALL"),
        ("import math", "G1-IMPORT"),
        ("from math import ceil", "G1-IMPORT"),
        ("import statistics", "G1-IMPORT"),
        ("from random import random", "G1-IMPORT"),
        ("def f(: pass", "G1-PARSE"),
    ],
)
def test_each_violation_shape_is_caught(source: str, code: str) -> None:
    violations = scan_source(source, Path("app/engine/x.py"))
    assert [v.code for v in violations] == [code] or code in [v.code for v in violations]


@pytest.mark.parametrize(
    "source",
    [
        'RATE = Decimal("0.18")',
        "total = a + b",
        "count = 12",
        "share = numerator / denominator",
        'name = "0.18"',
        "ratio = Decimal(1) / Decimal(3)",
    ],
)
def test_decimal_arithmetic_is_not_flagged(source: str) -> None:
    assert scan_source(source, Path("app/engine/x.py")) == []


# ---------------------------------------------------------------------------
# prove it by violating it -- docs/04 Phase 0 gate
# ---------------------------------------------------------------------------


@pytest.mark.golden
def test_a_deliberate_violation_breaks_the_build(backend_root: Path) -> None:
    """docs/04: 'G1 and G2 fail the build when deliberately violated -- prove it
    by violating them.'  This is that proof, run as a subprocess so it exercises
    the exact command CI runs."""
    probe = backend_root / PROBE
    probe.write_text(
        "RATE = 0.18  # deliberate G1 violation\n\n\ndef bad(x):\n    return float(x) * RATE\n",
        encoding="utf-8",
    )
    try:
        result = subprocess.run(
            [sys.executable, "tools/lint_no_float.py"],
            cwd=backend_root,
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 1, "G1 did not fail on a deliberate violation"
        assert "G1-LITERAL" in result.stderr
        assert "G1-CALL" in result.stderr
        assert "_probe.py" in result.stderr
    finally:
        probe.unlink(missing_ok=True)

    clean = subprocess.run(
        [sys.executable, "tools/lint_no_float.py"],
        cwd=backend_root,
        capture_output=True,
        text=True,
        check=False,
    )
    assert clean.returncode == 0, clean.stderr


def test_there_is_no_suppression_comment(backend_root: Path) -> None:
    """A rule that can be switched off where it is violated is a convention,
    not a guarantee."""
    linter = (backend_root / "tools/lint_no_float.py").read_text(encoding="utf-8")
    assert "noqa: G1" not in linter.replace('"noqa: G1"', "")
    probe_source = "RATE = 0.18  # noqa: G1\n"
    assert scan_source(probe_source, Path("app/engine/x.py")), "a comment must not disarm G1"
