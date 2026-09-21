"""The invoice graph, and Johnson's algorithm for elementary cycles.

Only NET-* and ITC-16 touch this, and it is built lazily because constructing a
graph for every taxpayer would cost more than every other rule combined.

> A cycle is evidence of a pattern, never of an offence.

Every finding derived from this module is ADVISORY, and the screen that renders
it carries the mandatory banner saying so.  An officer misled once by a graph
never trusts the platform again.
"""

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Final

__all__ = ["Cycle", "Edge", "InvoiceGraph"]

_ZERO: Final[Decimal] = Decimal("0.00")


@dataclass(frozen=True, slots=True)
class Edge:
    """Aggregate supply value from one GSTIN to another, within a window."""

    source: str
    target: str
    value: Decimal
    invoices: int = 0

    def key(self) -> tuple[str, str]:
        return (self.source, self.target)


@dataclass(frozen=True, slots=True)
class Cycle:
    """An elementary directed cycle, with the value that can circulate round it."""

    nodes: tuple[str, ...]
    #: The minimum edge value: the most that can actually flow round the loop.
    value: Decimal
    edges: tuple[Edge, ...]

    @property
    def length(self) -> int:
        return len(self.nodes)

    def as_dict(self) -> dict[str, object]:
        return {
            "nodes": list(self.nodes),
            "length": self.length,
            "value": format(self.value, "f"),
            "edges": [
                {"from": e.source, "to": e.target, "value": format(e.value, "f")}
                for e in self.edges
            ],
        }


@dataclass
class InvoiceGraph:
    """A directed multigraph of supplies, collapsed to one edge per pair."""

    edges: dict[tuple[str, str], Edge] = field(default_factory=dict)

    def add(self, source: str, target: str, value: Decimal, invoices: int = 1) -> None:
        if source == target:
            return  # a self-supply is not a trading relationship
        key = (source, target)
        existing = self.edges.get(key)
        if existing is None:
            self.edges[key] = Edge(source, target, value, invoices)
        else:
            self.edges[key] = Edge(
                source, target, existing.value + value, existing.invoices + invoices
            )

    def prune(self, minimum: Decimal) -> InvoiceGraph:
        """Drop edges below a value.

        Pruning first is what keeps cycle enumeration tractable: a corporate
        supply graph is dense with small recurring edges that cannot carry a
        material circular value.
        """
        return InvoiceGraph(
            edges={key: edge for key, edge in self.edges.items() if edge.value >= minimum}
        )

    @property
    def nodes(self) -> tuple[str, ...]:
        found: set[str] = set()
        for source, target in self.edges:
            found.add(source)
            found.add(target)
        return tuple(sorted(found))

    def successors(self, node: str) -> tuple[str, ...]:
        return tuple(sorted(target for source, target in self.edges if source == node))

    def turnover_of(self, node: str) -> Decimal:
        """Outbound value from a node, used for the cycle-to-turnover ratio."""
        total = _ZERO
        for (source, _), edge in self.edges.items():
            if source == node:
                total += edge.value
        return total

    # -- cycle enumeration --------------------------------------------------

    def cycles(self, *, min_length: int = 2, max_length: int = 5) -> list[Cycle]:
        """Elementary cycles of bounded length, in deterministic order.

        A depth-bounded enumeration in Johnson's style: the search starts only
        at the smallest node of a candidate cycle, which is what makes each
        cycle appear exactly once rather than once per rotation.
        """
        ordered = self.nodes
        rank = {node: index for index, node in enumerate(ordered)}
        found: list[Cycle] = []
        seen: set[tuple[str, ...]] = set()

        def walk(start: str, node: str, path: list[str], on_path: set[str]) -> None:
            for successor in self.successors(node):
                if successor == start and len(path) >= min_length:
                    canonical = tuple(path)
                    if canonical not in seen:
                        seen.add(canonical)
                        found.append(self._cycle_from(path))
                    continue
                if len(path) >= max_length:
                    continue
                # Only extend into nodes that rank above the start, so a cycle
                # is enumerated once, from its lowest-ranked member.
                if successor in on_path or rank[successor] <= rank[start]:
                    continue
                path.append(successor)
                on_path.add(successor)
                walk(start, successor, path, on_path)
                path.pop()
                on_path.discard(successor)

        for start in ordered:
            walk(start, start, [start], {start})

        found.sort(key=lambda cycle: (-cycle.value, cycle.nodes))
        return found

    def _cycle_from(self, path: list[str]) -> Cycle:
        edges: list[Edge] = []
        for index, node in enumerate(path):
            target = path[(index + 1) % len(path)]
            edge = self.edges[(node, target)]
            edges.append(edge)
        # The value that can circulate is bounded by the smallest edge.
        value = min(edge.value for edge in edges)
        return Cycle(nodes=tuple(path), value=value, edges=tuple(edges))

    def __len__(self) -> int:
        return len(self.edges)

    def __iter__(self) -> Iterator[Edge]:
        return iter(self.edges.values())
