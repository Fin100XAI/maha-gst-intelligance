"""Descriptive insight, and the line it must not cross.

These panels describe a filed year: who the purchases came from, what rates
were declared, when credit notes were issued. None of it is a finding, and the
tests that matter most here are the ones that keep it from becoming one by
accident -- a share that reads zero when there was nothing to divide by, a
rate printed as 0% when it was 0.25%, a top-five list whose bars do not add up
to the total it prints beside them.

The second half is the drill. A descriptive figure earns its place on a
quasi-judicial platform only because the reader can always reach the rows
behind it, so every drill is asserted to return exactly the rows that were
summed -- not approximately, and not a superset.
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
from app.api.v1.insights import PANELS, _rate_label, _share
from app.db.base import Base
from app.db.models import InwardLine, OutwardLine, Taxpayer
from app.main import create_app

COMMISSIONER = {"X-Officer-Id": "commissioner.mh", "X-Officer-Role": "COMMISSIONER"}
FILER = "27AAHCR8533P1ZL"
BIG = "27AAEFS7253H1ZZ"
SMALL = "27AAACK6801E1ZV"


@pytest.fixture
def factory() -> Iterator[sessionmaker[Session]]:
    engine = create_engine(
        "sqlite://", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, future=True, expire_on_commit=False)
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def client(factory: sessionmaker[Session]) -> Iterator[TestClient]:
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


def _seed(factory: sessionmaker[Session]) -> None:
    """One filer, four outward lines and three inward, all hand-computable.

    Outward: 100 at 18%, 300 at 18%, 100 at 0.25%, and a credit note of 40.
    Inward:  600 from BIG, 200 from SMALL, 200 from SMALL.
    """
    with factory() as session:
        session.add(
            Taxpayer(
                gstin=FILER, pan=FILER[2:12], legal_name="Ralgan Life Sciences", state_code="27"
            )
        )
        for index, (period, doc_type, party, rate, taxable) in enumerate(
            [
                ("042025", "INVOICE", SMALL, "18", "100.00"),
                ("042025", "INVOICE", BIG, "18", "300.00"),
                ("052025", "INVOICE", SMALL, "0.25", "100.00"),
                ("052025", "CREDIT_NOTE", SMALL, "18", "40.00"),
            ]
        ):
            session.add(
                OutwardLine(
                    id=f"o{index}",
                    snapshot_id="s1",
                    gstin=FILER,
                    period=period,
                    section="B2B",
                    doc_type=doc_type,
                    doc_no=f"INV{index}",
                    doc_date=date(2025, 4, 10),
                    counterparty_gstin=party,
                    rate=Decimal(rate),
                    taxable_value=Decimal(taxable),
                    prov_id=f"p{index}",
                )
            )
        for index, (supplier, taxable, available) in enumerate(
            [(BIG, "600.00", True), (SMALL, "200.00", True), (SMALL, "200.00", None)]
        ):
            session.add(
                InwardLine(
                    id=f"i{index}",
                    snapshot_id="s1",
                    gstin=FILER,
                    period="042025",
                    section="B2B",
                    doc_type="INVOICE",
                    doc_no=f"P{index}",
                    doc_date=date(2025, 4, 12),
                    supplier_gstin=supplier,
                    taxable_value=Decimal(taxable),
                    itc_available=available,
                    source_form="GSTR2B" if available is not None else "GSTR2A",
                    prov_id=f"q{index}",
                )
            )
        session.commit()


def _panel(client: TestClient, panel_id: str) -> dict[str, object]:
    body = client.get(f"/api/v1/insights/taxpayer/{FILER}", headers=COMMISSIONER).json()
    found = next(panel for panel in body["panels"] if panel["id"] == panel_id)
    assert isinstance(found, dict)
    return found


class TestTheFiguresAreTheHandComputedOnes:
    def test_supplier_concentration_sums_and_shares(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        _seed(factory)
        panel = _panel(client, "supplier_concentration")
        assert panel["total"] == "1000.00"
        items = {item["label"]: item for item in panel["items"]}  # type: ignore[index,union-attr]
        assert items[BIG]["value"] == "600.00"
        assert items[BIG]["share"] == "0.6000"
        assert items[SMALL]["value"] == "400.00"
        assert items[SMALL]["lines"] == 2

    def test_the_shares_of_a_ranked_panel_sum_to_one(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        """A top-five list that drops the remainder prints bars that do not
        add up to the total beside them. The remainder is a row of its own."""
        _seed(factory)
        panel = _panel(client, "supplier_concentration")
        shares = [Decimal(item["share"]) for item in panel["items"]]  # type: ignore[index,union-attr]
        assert sum(shares) == Decimal("1.0000")

    def test_rate_mix_keeps_a_fractional_rate_intact(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        _seed(factory)
        labels = {item["label"] for item in _panel(client, "rate_mix")["items"]}  # type: ignore[index,union-attr]
        assert "0.25%" in labels, labels
        assert "18%" in labels, labels

    def test_credit_notes_are_not_netted_into_turnover(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        """The monthly figure is invoices. A credit note adjusts it and is
        shown beside it; folding one into the other hides both."""
        _seed(factory)
        turnover = {
            item["label"]: item["value"]
            for item in _panel(client, "monthly_turnover")["items"]  # type: ignore[index,union-attr]
        }
        assert turnover["052025"] == "100.00"
        notes = {
            item["label"]: item
            for item in _panel(client, "credit_notes")["items"]  # type: ignore[index,union-attr]
        }
        assert notes["052025"]["credit_notes"] == "40.00"
        assert notes["052025"]["invoices"] == "100.00"

    def test_a_two_way_counterparty_is_reported_both_ways(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        _seed(factory)
        panel = _panel(client, "two_way_counterparties")
        assert panel["count"] == 2
        both = {item["label"]: item for item in panel["items"]}  # type: ignore[index,union-attr]
        assert both[SMALL]["sold_to"] == "240.00"
        assert both[SMALL]["bought_from"] == "400.00"


class TestUnstatedIsNeverReportedAsStated:
    def test_a_2a_line_is_unstated_not_available(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        """GSTR-2A has no availability column. Reporting its lines as
        "available" would manufacture an assurance the file never gave."""
        _seed(factory)
        items = {item["label"]: item for item in _panel(client, "credit_source")["items"]}  # type: ignore[index,union-attr]
        assert "GSTR2A - availability not stated" in items, list(items)
        assert items["GSTR2A - availability not stated"]["value"] == "200.00"
        assert items["GSTR2B - marked available"]["value"] == "800.00"

    def test_a_share_with_no_denominator_is_absent_rather_than_zero(self) -> None:
        """ "Nothing was purchased" is not "nothing came from this supplier"."""
        assert _share(Decimal("10"), Decimal("0")) is None
        assert _share(Decimal("0"), Decimal("10")) == "0.0000"

    @pytest.mark.parametrize(
        ("stored", "shown"),
        [
            (Decimal("5.0000000000"), "5%"),
            (Decimal("0E-10"), "0%"),
            (Decimal("0.2500000000"), "0.25%"),
            (Decimal("1.5"), "1.5%"),
            (None, "rate not stated"),
        ],
    )
    def test_a_rate_is_shown_as_a_person_writes_it(
        self, stored: Decimal | None, shown: str
    ) -> None:
        assert _rate_label(stored) == shown


class TestEveryFigureReachesItsRows:
    def test_each_panel_item_carries_a_drill_or_says_why_not(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        """Law 2 in the form it takes here: no figure without a way back to
        the rows. The only element allowed no drill is the folded remainder,
        which is a count of rows rather than a set of them."""
        _seed(factory)
        body = client.get(f"/api/v1/insights/taxpayer/{FILER}", headers=COMMISSIONER).json()
        for panel in body["panels"]:
            for item in panel["items"]:
                if item["drill"] is None:
                    assert "other" in item["label"], (panel["id"], item["label"])
                else:
                    assert item["drill"]["panel"] == panel["id"]

    def test_the_drill_returns_exactly_the_rows_that_were_summed(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        _seed(factory)
        response = client.get(
            "/api/v1/insights/rows",
            params={"gstin": FILER, "panel": "supplier_concentration", "bucket": SMALL},
            headers=COMMISSIONER,
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["total"] == 2
        assert sum(Decimal(row["taxable_value"]) for row in body["items"]) == Decimal("400.00")

    def test_a_drilled_row_carries_its_provenance(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        """Without prov_id the drill stops at a table. With it, it reaches the
        file, the sheet, the row and the original cells."""
        _seed(factory)
        body = client.get(
            "/api/v1/insights/rows",
            params={"gstin": FILER, "panel": "monthly_turnover", "bucket": "042025"},
            headers=COMMISSIONER,
        ).json()
        assert body["items"], body
        assert all(row["prov_id"] for row in body["items"])

    def test_a_fractional_rate_drills_to_its_own_rows(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        """The regression: the bucket was parsed as an int, so 0.25% drilled
        into 0% and returned rows the bar was never made of."""
        _seed(factory)
        body = client.get(
            "/api/v1/insights/rows",
            params={"gstin": FILER, "panel": "rate_mix", "bucket": "0.25"},
            headers=COMMISSIONER,
        ).json()
        assert body["total"] == 1, body
        assert body["items"][0]["taxable_value"] == "100.00"


class TestTheScreenSaysWhatItIsNot:
    def test_every_panel_states_how_to_read_it(self) -> None:
        for panel in PANELS:
            assert panel.reading, panel.id

    def test_the_response_says_this_is_not_a_finding(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        _seed(factory)
        body = client.get(f"/api/v1/insights/taxpayer/{FILER}", headers=COMMISSIONER).json()
        assert "Not a finding" in body["note"]

    def test_an_unknown_taxpayer_is_404_not_403(self, client: TestClient) -> None:
        """403 would confirm the GSTIN exists to an officer who may not see it."""
        response = client.get("/api/v1/insights/taxpayer/27ZZZZZ0000Z1ZZ", headers=COMMISSIONER)
        assert response.status_code == 404

    def test_an_unknown_panel_is_refused_rather_than_guessed(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        _seed(factory)
        response = client.get(
            "/api/v1/insights/rows",
            params={"gstin": FILER, "panel": "whatever", "bucket": "x"},
            headers=COMMISSIONER,
        )
        assert response.status_code == 404
