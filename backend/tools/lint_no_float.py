"""G1 -- no binary float may exist under the trees that compute a statutory figure.

Law 1 says every rupee, ratio, day-count, flag and score is computed in
``Decimal``.  The cheapest way to keep that true is to make the alternative
unavailable: this AST check fails the build on a float literal, on a call to
``float()`` or to any ``numpy`` float constructor, and on an import of a module
whose functions return floats.

There is deliberately **no suppression comment**.  A rule that can be switched
off at the point of violation is a convention, not a guarantee, and the whole
argument for this platform is that its numbers are guaranteed.

Usage::

    python tools/lint_no_float.py [path ...]      # defaults to every guarded tree

Exits 0 when clean, 1 on any violation.
"""

from __future__ import annotations

import ast
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Final

#: The trees Law 1 guards.  Presentation and test code may use floats freely;
#: nothing that computes, scores, prices or renders a statutory figure may.
#:
#: ``app/money.py`` is deliberately outside: it is the single boundary where a
#: spreadsheet's binary float is converted to an exact Decimal, and it must
#: name ``float`` to do it.
GUARDED: Final[tuple[str, ...]] = (
    "app/engine",
    "app/ingestion",
    # The match ladder decides which two rows are the same document, and a
    # rounded value or an edit-distance ratio computed in binary float would
    # make that decision non-reproducible - the same snapshot pairing
    # differently on a different machine. CLAUDE.md names this tree
    # explicitly; the lint was written before the tree existed.
    "app/matching",
    "app/aggregation",
    "app/cases",
    "app/notices",
    "app/agents",
    "app/security",
    "app/api",
)

#: Modules whose functions return binary floats.  ``decimal`` is the way.
FLOAT_MODULES: Final[frozenset[str]] = frozenset({"math", "cmath", "statistics", "random"})

#: Float constructors, including the numpy spellings that survive a `.item()`.
FLOAT_CALLABLES: Final[frozenset[str]] = frozenset(
    {
        "float",
        "float16",
        "float32",
        "float64",
        "float128",
        "longdouble",
        "double",
        "half",
        "single",
        "complex",
    }
)


@dataclass(frozen=True, slots=True)
class Violation:
    path: Path
    line: int
    col: int
    code: str
    message: str

    def render(self, root: Path) -> str:
        try:
            shown = self.path.relative_to(root)
        except ValueError:  # pragma: no cover - path outside the repo
            shown = self.path
        return f"{shown}:{self.line}:{self.col}: {self.code} {self.message}"


class _FloatHunter(ast.NodeVisitor):
    def __init__(self, path: Path) -> None:
        self.path = path
        self.found: list[Violation] = []

    def _flag(self, node: ast.AST, code: str, message: str) -> None:
        self.found.append(
            Violation(
                self.path,
                getattr(node, "lineno", 0),
                getattr(node, "col_offset", 0),
                code,
                message,
            )
        )

    def visit_Constant(self, node: ast.Constant) -> None:
        if isinstance(node.value, float):
            self._flag(
                node,
                "G1-LITERAL",
                f'float literal {node.value!r}; write Decimal("{node.value}") or D(...)',
            )
        elif isinstance(node.value, complex):
            self._flag(node, "G1-LITERAL", "complex literal has no place in a tax computation")
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name) -> None:
        if node.id == "float" and isinstance(node.ctx, ast.Load):
            self._flag(node, "G1-CALL", "float(); coerce with app.money.D instead")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute) -> None:
        if node.attr in FLOAT_CALLABLES:
            self._flag(node, "G1-CALL", f"{node.attr}() produces a binary float")
        self.generic_visit(node)

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            root = alias.name.split(".")[0]
            if root in FLOAT_MODULES:
                self._flag(node, "G1-IMPORT", f"{alias.name} returns binary floats")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        root = (node.module or "").split(".")[0]
        if root in FLOAT_MODULES:
            self._flag(node, "G1-IMPORT", f"{node.module} returns binary floats")
        self.generic_visit(node)


def scan_source(source: str, path: Path) -> list[Violation]:
    """Scan one module's text.  A syntax error is itself a violation, not a skip."""
    try:
        tree = ast.parse(source, filename=str(path))
    except SyntaxError as exc:
        return [Violation(path, exc.lineno or 0, exc.offset or 0, "G1-PARSE", str(exc.msg))]
    hunter = _FloatHunter(path)
    hunter.visit(tree)
    return hunter.found


def scan_path(target: Path) -> list[Violation]:
    files = sorted(target.rglob("*.py")) if target.is_dir() else [target]
    violations: list[Violation] = []
    for file in files:
        violations.extend(scan_source(file.read_text(encoding="utf-8"), file))
    return violations


def main(argv: list[str] | None = None) -> int:
    args = list(argv if argv is not None else sys.argv[1:])
    root = Path(__file__).resolve().parent.parent
    targets = [Path(a).resolve() for a in args] if args else [root / g for g in GUARDED]

    violations: list[Violation] = []
    for target in targets:
        if not target.exists():
            # A guarded tree that does not exist yet is not an error; it becomes
            # one the moment somebody writes a float into it.
            continue
        violations.extend(scan_path(target))

    if not violations:
        scanned = ", ".join(str(t.relative_to(root)) for t in targets if t.exists())
        print(f"G1 clean: no binary float under {scanned or '(no guarded tree yet)'}")
        return 0

    print(f"G1 FAILED: {len(violations)} float violation(s)", file=sys.stderr)
    for violation in violations:
        print("  " + violation.render(root), file=sys.stderr)
    print(
        "\nLaw 1: every rupee, ratio, day-count, flag and score is Decimal.\n"
        "There is no suppression comment for this rule -- fix the arithmetic.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
