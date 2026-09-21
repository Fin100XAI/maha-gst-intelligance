"""A 2B line's eligibility must survive the trip from the database.

``InwardRecord.counts_toward_2b_available`` decides whether a document is
credit the taxpayer was entitled to. It reads three fields: whether the portal
marked the ITC available, which section the document sits in, and what the
recipient did with it in IMS.

``load.py`` rebuilt the record for the engine and copied none of them. Every
line therefore arrived with ``itc_available=None``, the property returned
False for all of them, and the whole GSTR-2B counted as zero available credit.

P14 is "ITC claimed in excess of GSTR-2B". With the 2B side at zero it reduces
to "ITC claimed", so it fired at Flag 4 on ten businesses out of ten -- on the
six whose returns agree to the paisa as loudly as on the four that over-claim.
A parameter that flags everybody has stopped being a parameter, and the shape
of the failure is one that reads as a working screen.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import InwardLine, Snapshot
from app.engine.load import load_taxpayer_data

GSTIN = "27AAGCS4521P1ZX"
SUPPLIER = "27AAACS1234F1ZS"
SNAPSHOT = "snap-1"

#: (doc_no, available, ims_action, section, tax) -- three eligible, three not.
LINES = (
    ("INV-1", True, None, "B2B", "18000.00"),
    ("INV-2", True, "ACCEPTED", "B2B", "9000.00"),
    ("INV-3", True, "NO_ACTION", "B2B", "3000.00"),
    ("INV-4", False, None, "B2B", "5000.00"),
    ("INV-5", True, "REJECTED", "B2B", "7000.00"),
    ("INV-6", True, None, "IMPG", "4000.00"),
)

ELIGIBLE = Decimal("30000.00")


@pytest.fixture
def session():  # type: ignore[no-untyped-def]
    engine = create_engine(
        "sqlite://", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)
    with factory() as handle:
        handle.add(
            Snapshot(id=SNAPSHOT, content_hash="h" * 64, created_by="test", description="test")
        )
        for index, (doc_no, available, ims, section, tax) in enumerate(LINES):
            handle.add(
                InwardLine(
                    id=f"in-{index}",
                    snapshot_id=SNAPSHOT,
                    gstin=GSTIN,
                    period="042025",
                    section=section,
                    doc_type="INVOICE",
                    doc_no=doc_no,
                    doc_date=date(2025, 4, 5),
                    supplier_gstin=SUPPLIER,
                    pos="27",
                    taxable_value=Decimal("100000.00"),
                    igst=Decimal("0.00"),
                    cgst=Decimal(tax) / 2,
                    sgst=Decimal(tax) / 2,
                    cess=Decimal("0.00"),
                    itc_available=available,
                    ims_action=ims,
                    supplier_filing_date=date(2025, 5, 11),
                    supplier_return_period="042025",
                )
            )
        handle.commit()
        yield handle
    Base.metadata.drop_all(engine)
    engine.dispose()


class TestEligibilitySurvivesTheLoad:
    def test_every_line_is_loaded(self, session) -> None:  # type: ignore[no-untyped-def]
        data = load_taxpayer_data(session, GSTIN, SNAPSHOT)
        assert len(data.inward) == len(LINES)

    @pytest.mark.golden
    def test_availability_is_carried_through(self, session) -> None:  # type: ignore[no-untyped-def]
        """The regression. Dropped, every line reads as unavailable."""
        data = load_taxpayer_data(session, GSTIN, SNAPSHOT)
        by_doc = {row.doc_no: row for row in data.inward}
        assert by_doc["INV-1"].itc_available is True
        assert by_doc["INV-4"].itc_available is False

    @pytest.mark.golden
    def test_only_the_eligible_lines_count_toward_the_2b_bucket(self, session) -> None:  # type: ignore[no-untyped-def]
        """Available, B2B or CDNR, and not rejected in IMS.

        Blocked credit, a rejected record and an import all sit in the 2B and
        none of them is "all other ITC". Counting the statement gross is the
        comparison that collapses on reply.
        """
        data = load_taxpayer_data(session, GSTIN, SNAPSHOT)
        available = sum(
            (row.signed_tax.total for row in data.inward if row.counts_toward_2b_available),
            Decimal("0.00"),
        )
        assert available == ELIGIBLE

    def test_the_ims_action_is_carried_through(self, session) -> None:  # type: ignore[no-untyped-def]
        data = load_taxpayer_data(session, GSTIN, SNAPSHOT)
        by_doc = {row.doc_no: row for row in data.inward}
        assert by_doc["INV-2"].ims_action == "ACCEPTED"
        assert by_doc["INV-5"].ims_action == "REJECTED"
        assert by_doc["INV-5"].counts_toward_2b_available is False

    def test_the_supplier_filing_details_are_carried_through(self, session) -> None:  # type: ignore[no-untyped-def]
        """Three rules test whether the supplier filed, and when."""
        data = load_taxpayer_data(session, GSTIN, SNAPSHOT)
        row = next(r for r in data.inward if r.doc_no == "INV-1")
        assert row.supplier_filing_date == date(2025, 5, 11)
        assert row.supplier_return_period is not None
        assert row.supplier_return_period.mmyyyy == "042025"
