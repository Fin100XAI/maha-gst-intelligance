"""Law 4, asserted structurally: the LLM is a scribe and a librarian.

Four separate things have to hold, and each is checked here rather than
trusted. Every one of them is the kind of property that survives review and
then quietly stops being true three refactors later, because nothing was
watching.

1. **No agent tool computes.** A tool reads rows the engine already wrote. The
   moment one sums a column, the model is being handed a figure nobody can
   trace, and it will end up in a notice.
2. **Nothing outside the agent layer reads a model's output.** The completion
   is text for an officer to read and sign. If any other module parsed it, the
   arithmetic guarantee would be gone whatever the prompt said.
3. **The fidelity checker reads the model's numbers only to reject them.** It
   parses figures out of a completion, which is the one place a `Decimal` is
   constructed from model text -- in the direction of refusal, never of use.
4. **A notice slot is filled from the demand, never from prose.** Templates
   carry `{{slot:path}}` into the computed demand; the drafting model never
   sees slot syntax and cannot supply a value.
"""

from __future__ import annotations

import ast
import re
from decimal import Decimal
from pathlib import Path

import pytest

from app.agents.catalogue import AGENTS
from app.agents.fidelity import check_completion

APP = Path(__file__).resolve().parents[2] / "app"
AGENT_DIR = APP / "agents"

#: Arithmetic on money, as an AST node type. A tool that contains one of these
#: over anything but an index or a slice is computing.
_ARITHMETIC = (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Pow, ast.Mod)


def _tool_functions() -> list[tuple[str, ast.FunctionDef]]:
    """Every function registered as a tool on any agent."""
    names = {tool.name for spec in AGENTS.values() for tool in spec.tools}
    source = (AGENT_DIR / "catalogue.py").read_text(encoding="utf-8")
    tree = ast.parse(source)

    # Map the Tool(...) declarations to the function each one runs.
    runners: dict[str, str] = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Name):
            continue
        if node.func.id != "Tool":
            continue
        # Tools are declared positionally: Tool(name, description, run).
        kwargs = {kw.arg: kw.value for kw in node.keywords}
        name_node = kwargs.get("name") or (node.args[0] if node.args else None)
        run_node = kwargs.get("run") or (node.args[2] if len(node.args) > 2 else None)
        if isinstance(name_node, ast.Constant) and isinstance(run_node, ast.Name):
            runners[str(name_node.value)] = run_node.id

    functions = {node.name: node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)}
    found: list[tuple[str, ast.FunctionDef]] = []
    for tool_name in sorted(names):
        runner = runners.get(tool_name)
        assert runner is not None, f"tool {tool_name!r} has no run function in catalogue.py"
        assert runner in functions, f"{runner!r} is not defined in catalogue.py"
        found.append((tool_name, functions[runner]))
    return found


class TestNoToolComputes:
    def test_every_agent_tool_was_located(self) -> None:
        """If this fails the rest of the class is checking nothing."""
        assert len(_tool_functions()) >= 5

    @pytest.mark.golden
    def test_no_tool_performs_arithmetic(self) -> None:
        """A tool returns rows. It does not add, subtract, multiply or divide.

        Slicing and indexing are fine -- ``rows[:50]`` is not arithmetic on a
        figure -- so only BinOp nodes count, and a string concatenation of two
        literals would be caught too, which is the conservative direction.
        """
        offenders: list[str] = []
        for tool_name, function in _tool_functions():
            for node in ast.walk(function):
                if isinstance(node, ast.BinOp) and isinstance(node.op, _ARITHMETIC):
                    offenders.append(f"{tool_name} ({function.name}) line {node.lineno}")
        assert offenders == [], (
            "an agent tool performs arithmetic, so the model would be handed a "
            f"figure the engine never computed: {offenders}"
        )

    def test_no_tool_constructs_a_decimal(self) -> None:
        """Money reaches a tool already computed, or it does not reach it."""
        offenders: list[str] = []
        for tool_name, function in _tool_functions():
            for node in ast.walk(function):
                if (
                    isinstance(node, ast.Call)
                    and isinstance(node.func, ast.Name)
                    and node.func.id in {"Decimal", "float", "sum"}
                ):
                    offenders.append(f"{tool_name}: {node.func.id}() at line {node.lineno}")
        assert offenders == [], offenders


class TestNothingElseReadsTheModel:
    @pytest.mark.golden
    def test_no_module_outside_the_agent_layer_consumes_a_completion(self) -> None:
        """The completion is text for an officer, and goes nowhere else.

        The agent layer may read its own output -- that is what the fidelity
        checker does. Nothing downstream may, because a figure parsed out of
        prose has no calc_id and cannot be drilled.
        """
        pattern = re.compile(r"\b(completion|answer)\.text\b")
        offenders: list[str] = []
        for path in APP.rglob("*.py"):
            if AGENT_DIR in path.parents or path.parent == AGENT_DIR:
                continue
            for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                if pattern.search(line) and not line.lstrip().startswith("#"):
                    offenders.append(f"{path.relative_to(APP).as_posix()}:{number}")
        assert offenders == [], offenders

    def test_only_the_agent_layer_imports_the_provider(self) -> None:
        offenders: list[str] = []
        for path in APP.rglob("*.py"):
            if AGENT_DIR in path.parents or path.parent == AGENT_DIR:
                continue
            text = path.read_text(encoding="utf-8")
            if "agents.provider" in text and "import" in text:
                offenders.append(path.relative_to(APP).as_posix())
        # The API layer builds the provider to hand it to the runtime; that is
        # the one legitimate crossing, and it never reads a figure from it.
        assert offenders in ([], ["api/v1/agents.py"]), offenders


class TestTheCheckerRejectsRatherThanUses:
    @pytest.mark.golden
    def test_an_invented_figure_fails_the_whole_response(self) -> None:
        """Not corrected, not stripped -- the response is refused."""
        grounded = check_completion(
            "The shortfall is 1,98,000.00 for the period.",
            tool_results=[{"tool": "findings", "rows": [{"igst": "198000.00"}]}],
        )
        assert grounded.ok is True

        invented = check_completion(
            "The shortfall is 2,50,000.00 for the period.",
            tool_results=[{"tool": "findings", "rows": [{"igst": "198000.00"}]}],
        )
        assert invented.ok is False
        assert invented.untraceable != []

    def test_the_model_may_reformat_a_figure_but_not_change_it(self) -> None:
        """3842110.00 and 38,42,110 are the same value and must both pass."""
        for spelling in ("3842110.00", "38,42,110", "3842110"):
            result = check_completion(
                f"The demand is {spelling}.",
                tool_results=[{"tool": "findings", "rows": [{"total": "3842110.00"}]}],
            )
            assert result.ok is True, spelling

    def test_a_figure_one_paisa_out_is_not_grounded(self) -> None:
        """The tolerance is zero. It has to be: this becomes a demand."""
        result = check_completion(
            "The demand is 3842110.01.",
            tool_results=[{"tool": "findings", "rows": [{"total": "3842110.00"}]}],
        )
        assert result.ok is False


class TestNoticeFiguresComeFromTheDemand:
    def test_a_template_slot_is_a_path_not_a_literal(self) -> None:
        """`{{slot:demand.igst}}`, resolved from the computed demand."""
        from app.notices.templates import _SLOT

        assert _SLOT.findall("{{slot:demand.total_tax}}") == ["demand.total_tax"]
        # A literal in slot position is still only a *path*. It names nothing in
        # the demand, so filling raises SlotError rather than writing the
        # number through -- asserted below, because the regex alone does not
        # distinguish "300000.00" from "demand.total_tax" and should not have
        # to: resolution is what refuses it.
        assert _SLOT.findall("{{slot:300000.00}}") == ["300000.00"]

    def test_a_slot_that_names_no_figure_in_the_demand_raises(self) -> None:
        """The refusal, rather than the regex, is the actual protection."""
        from app.notices.templates import SlotError, _resolve

        with pytest.raises((SlotError, KeyError, LookupError, AttributeError, TypeError)):
            _resolve("300000.00", {"demand": {"total_tax": "300000.00"}})

    def test_the_drafting_model_never_sees_slot_syntax(self) -> None:
        """If it did, it could write one, and the figure would be its own."""
        drafter = AGENTS["notice_drafter"]
        assert "{{slot:" not in drafter.system
        assert "slot" not in drafter.system.lower() or "never" in drafter.system.lower()


class TestTheGuaranteeIsStatedWhereItIsMade:
    def test_every_agent_declares_what_it_may_read(self) -> None:
        for key, spec in AGENTS.items():
            assert spec.tools != () or key in {"column_mapper"}, key
            for tool in spec.tools:
                assert tool.description.strip() != "", f"{key}/{tool.name}"

    def test_money_arithmetic_uses_decimal_not_float(self) -> None:
        """Belt and braces: the checker's own comparison is exact."""
        from app.agents.fidelity import normalise_number

        assert normalise_number("38,42,110") == format(Decimal("3842110"), "f")
        assert normalise_number("0.1") == "0.1"
