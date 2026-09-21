"""The Reconciliation Workbench: eleven identities, three states, no blanks.

The state that matters is the third one. An identity that could not be tested
must not render as one that passed, and a matrix of ticks and gaps will be read
as ticks - so NOT_EVALUATED is a cell with a reason in it, not an absence.
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_session
from app.db.base import Base
from app.db.models import EngineRun, IdentityCheck, Taxpayer
from app.main import create_app

RUN = "run-1"
PUNE = "27AAPFU0939F1ZV"
NAGPUR = "27AACCM9910C1ZN"
STO = {"X-Officer-Id": "sto.pune.4", "X-Officer-Role": "STO", "X-Officer-Divisions": "PUNE-II"}
HEAD = {"X-Officer-Id": "c", "X-Officer-Role": "COMMISSIONER"}


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)
    with factory() as setup:
        _seed(setup)
        setup.commit()

    def override() -> Iterator[Session]:
        session = factory()
        try:
            yield session
            session.commit()
        finally:
            session.close()

    app = create_app()
    app.dependency_overrides[get_session] = override
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(engine)
    engine.dispose()


def _seed(session: Session) -> None:
    session.add_all(
        [
            Taxpayer(
                gstin=PUNE,
                pan="AAPFU0939F",
                legal_name="Umang Fabricators LLP",
                state_code="27",
                division="PUNE-II",
            ),
            Taxpayer(
                gstin=NAGPUR,
                pan="AACCM9910C",
                legal_name="Mahalaxmi Traders Pvt Ltd",
                state_code="27",
                division="NAGPUR-I",
            ),
            EngineRun(
                id=RUN,
                snapshot_id="snap-1",
                as_of=date(2026, 9, 20),
                fy="2025-26",
                engine_version="0.1.0",
                params_version="unapproved-defaults",
                triggered_by="test",
                status="COMPLETE",
            ),
        ]
    )

    rows = [
        # period, identity, status, igst, cgst, missing
        ("042025", "R1", "BREACHED", "198000.00", "-198000.00", []),
        ("042025", "R2", "NOT_EVALUATED", "0.00", "0.00", ["gstr2b"]),
        ("042025", "R3", "HOLDS", "0.00", "0.00", []),
        ("052025", "R1", "HOLDS", "0.00", "0.00", []),
        ("052025", "R2", "NOT_EVALUATED", "0.00", "0.00", ["gstr2b"]),
        ("052025", "R3", "HOLDS", "0.00", "0.00", []),
    ]
    for index, (period, identity, status, igst, cgst, missing) in enumerate(rows):
        session.add(
            IdentityCheck(
                id=f"i-{index}",
                engine_run_id=RUN,
                gstin=PUNE,
                period=period,
                fy="2025-26",
                identity_id=identity,
                title=f"{identity} title",
                status=status,
                delta_igst=Decimal(igst),
                delta_cgst=Decimal(cgst),
                delta_sgst=Decimal("0.00"),
                delta_cess=Decimal("0.00"),
                missing_inputs=missing,
                consequence="Rule 88C" if identity == "R1" else None,
                calc_id=str(index) * 64,
            )
        )


class TestMatrix:
    def test_it_returns_a_cell_for_every_period_and_identity(self, client: TestClient) -> None:
        body = client.get(f"/api/v1/taxpayers/{PUNE}/reconciliation", headers=STO).json()
        assert body["periods"] == ["042025", "052025"]
        assert [row["identity_id"] for row in body["identities"]] == ["R1", "R2", "R3"]
        assert len(body["cells"]) == 6

    @pytest.mark.golden
    def test_not_evaluated_is_a_state_with_a_reason_not_a_blank(self, client: TestClient) -> None:
        """A matrix of ticks and gaps is read as ticks."""
        body = client.get(f"/api/v1/taxpayers/{PUNE}/reconciliation", headers=STO).json()
        cell = next(
            row for row in body["cells"] if row["identity_id"] == "R2" and row["period"] == "042025"
        )
        assert cell["status"] == "NOT_EVALUATED"
        assert cell["missing_inputs"] == ["gstr2b"]
        assert cell["calc_id"]

    @pytest.mark.golden
    def test_a_breach_is_head_wise_and_does_not_net_to_zero(self, client: TestClient) -> None:
        """+1,98,000 IGST and -1,98,000 CGST is two errors, not none."""
        body = client.get(f"/api/v1/taxpayers/{PUNE}/reconciliation", headers=STO).json()
        cell = next(
            row for row in body["cells"] if row["identity_id"] == "R1" and row["period"] == "042025"
        )
        assert cell["status"] == "BREACHED"
        assert cell["delta"]["igst"] == "198000.00"
        assert cell["delta"]["cgst"] == "-198000.00"
        # The net is zero, and the status is still BREACHED.
        assert cell["delta_total"] == "0.00"

    def test_the_counts_add_up_to_the_cells(self, client: TestClient) -> None:
        body = client.get(f"/api/v1/taxpayers/{PUNE}/reconciliation", headers=STO).json()
        assert sum(body["counts"].values()) == len(body["cells"])
        assert body["counts"]["NOT_EVALUATED"] == 2

    def test_every_cell_carries_a_calc_id(self, client: TestClient) -> None:
        body = client.get(f"/api/v1/taxpayers/{PUNE}/reconciliation", headers=STO).json()
        for cell in body["cells"]:
            assert len(cell["calc_id"]) == 64

    def test_a_taxpayer_out_of_scope_is_404(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/taxpayers/{NAGPUR}/reconciliation", headers=STO)
        assert response.status_code == 404

    @pytest.mark.golden
    def test_a_run_without_identities_says_so(self, client: TestClient) -> None:
        """A run made with identities disabled has an empty matrix, and the
        screen must not present that as a clean reconciliation."""
        body = client.get(f"/api/v1/taxpayers/{NAGPUR}/reconciliation", headers=HEAD).json()
        assert body["periods"] == []
        assert body["cells"] == []
        assert "not evaluated" in body["note"].lower() or "none" in body["note"].lower()
