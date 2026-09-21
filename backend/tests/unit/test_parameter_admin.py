"""The threshold register: who set a value, when, and on what authority.

The distinction these tests protect is the one an officer relies on in front of
an appellate forum: a working value the platform shipped with, a value the
department adopted, and a value a notification backs are three different
things, and a screen that blurred them would be quoted as if they were one.
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.admin.parameters import (
    STATUS_DEPARTMENT,
    STATUS_NOTIFIED,
    STATUS_PROVISIONAL,
    load_parameter_set,
    seed_parameters,
    status_of,
)
from app.api.deps import get_session
from app.audit.chain import verify_chain
from app.db.base import Base
from app.db.models import AuditLog, RuleParameter
from app.main import create_app

COMMISSIONER = {"X-Officer-Id": "commissioner.mh", "X-Officer-Role": "COMMISSIONER"}
STO = {"X-Officer-Id": "sto.pune.4", "X-Officer-Role": "STO", "X-Officer-Divisions": "PUNE-II"}


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)

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
        test_client.factory = factory  # type: ignore[attr-defined]
        yield test_client
    Base.metadata.drop_all(engine)
    engine.dispose()


class TestRegister:
    def test_the_shipped_values_arrive_provisional(self, client: TestClient) -> None:
        """The platform states what it is running on; it claims nobody signed it."""
        body = client.get("/api/v1/admin/parameters", headers=COMMISSIONER).json()
        assert body["count"] > 100
        assert body["by_status"].get(STATUS_PROVISIONAL) == body["count"]

    def test_seeding_twice_writes_nothing_the_second_time(self, client: TestClient) -> None:
        client.get("/api/v1/admin/parameters", headers=COMMISSIONER)
        with client.factory() as session:  # type: ignore[attr-defined]
            first = session.execute(select(RuleParameter)).scalars().all()
            assert seed_parameters(session) == 0
            again = session.execute(select(RuleParameter)).scalars().all()
        assert len(first) == len(again)

    def test_every_row_says_what_stands_behind_it(self, client: TestClient) -> None:
        body = client.get("/api/v1/admin/parameters", headers=COMMISSIONER).json()
        for row in body["items"]:
            assert row["status"] in {STATUS_PROVISIONAL, STATUS_DEPARTMENT, STATUS_NOTIFIED}


class TestAdoption:
    @pytest.mark.golden
    def test_adoption_records_who_and_leaves_the_figures_alone(self, client: TestClient) -> None:
        """Adopting changes the authority, never the number."""
        before = client.get("/api/v1/admin/parameters", headers=COMMISSIONER).json()
        values = {(row["owner"], row["key"]): row["value"] for row in before["items"]}

        response = client.post(
            "/api/v1/admin/parameters/adopt",
            headers=COMMISSIONER,
            json={"acknowledgement": "Adopted by the Commissioner for FY 2025-26 scrutiny."},
        )
        assert response.status_code == 200
        assert response.json()["adopted"] == before["count"]

        after = client.get("/api/v1/admin/parameters", headers=COMMISSIONER).json()
        assert {(r["owner"], r["key"]): r["value"] for r in after["items"]} == values
        assert after["by_status"].get(STATUS_DEPARTMENT) == after["count"]
        assert after["by_status"].get(STATUS_PROVISIONAL) is None
        for row in after["items"]:
            assert row["approved_by"] == "commissioner.mh"
            assert row["approved_at"] is not None

    def test_adoption_is_audited(self, client: TestClient) -> None:
        client.post(
            "/api/v1/admin/parameters/adopt",
            headers=COMMISSIONER,
            json={"acknowledgement": "Adopted for the FY 2025-26 scrutiny cycle."},
        )
        with client.factory() as session:  # type: ignore[attr-defined]
            entry = (
                session.execute(select(AuditLog).where(AuditLog.action == "PARAMETERS_ADOPTED"))
                .scalars()
                .one()
            )
            assert entry.actor == "commissioner.mh"
            assert entry.detail["adopted"] > 100
            assert verify_chain(session).ok is True

    def test_an_acknowledgement_is_required(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/admin/parameters/adopt", headers=COMMISSIONER, json={"acknowledgement": "ok"}
        )
        assert response.status_code == 422

    def test_a_field_officer_may_not_adopt(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/admin/parameters/adopt",
            headers=STO,
            json={"acknowledgement": "Trying to adopt without the authority."},
        )
        assert response.status_code == 403

    @pytest.mark.golden
    def test_a_notified_value_is_not_overwritten_by_adoption(self, client: TestClient) -> None:
        """A statutory citation outranks a departmental decision."""
        client.put(
            "/api/v1/admin/parameters/OUT-01/pct_threshold",
            headers=COMMISSIONER,
            json={
                "value": "20",
                "effective_from": "2023-01-01",
                "notification_ref": "Notification 26/2022-CT dated 26.12.2022",
            },
        )
        client.post(
            "/api/v1/admin/parameters/adopt",
            headers=COMMISSIONER,
            json={"acknowledgement": "Adopting the remaining working values."},
        )
        body = client.get("/api/v1/admin/parameters?owner=OUT-01", headers=COMMISSIONER).json()
        row = next(r for r in body["items"] if r["key"] == "pct_threshold")
        assert row["status"] == STATUS_NOTIFIED
        assert row["notification_ref"].startswith("Notification 26/2022")


class TestSetting:
    @pytest.mark.golden
    def test_setting_a_value_does_not_rewrite_history(self, client: TestClient) -> None:
        """A re-run over an earlier period must apply the earlier value."""
        client.get("/api/v1/admin/parameters", headers=COMMISSIONER)

        response = client.put(
            "/api/v1/admin/parameters/OUT-01/amount_threshold",
            headers=COMMISSIONER,
            json={"value": "5000000", "effective_from": "2025-04-01"},
        )
        assert response.status_code == 200
        assert response.json()["value"] == "5000000"
        assert response.json()["status"] == STATUS_DEPARTMENT

        with client.factory() as session:  # type: ignore[attr-defined]
            rows = (
                session.execute(
                    select(RuleParameter).where(
                        RuleParameter.rule_or_param_id == "OUT-01",
                        RuleParameter.key == "amount_threshold",
                    )
                )
                .scalars()
                .all()
            )
            assert len(rows) == 2, "the previous value must still exist"
            old = next(r for r in rows if r.effective_to is not None)
            assert old.effective_to == date(2025, 3, 31)
            assert old.value == "2500000"

            # The engine resolving as at an earlier period gets the old value.
            params = load_parameter_set(session)
            assert params.get("OUT-01", "amount_threshold", on=date(2024, 6, 1)).raw == "2500000"
            assert params.get("OUT-01", "amount_threshold", on=date(2025, 6, 1)).raw == "5000000"

    def test_a_change_is_audited_with_its_effective_date(self, client: TestClient) -> None:
        client.put(
            "/api/v1/admin/parameters/OUT-01/amount_threshold",
            headers=COMMISSIONER,
            json={"value": "3000000", "effective_from": "2025-04-01"},
        )
        with client.factory() as session:  # type: ignore[attr-defined]
            entry = (
                session.execute(select(AuditLog).where(AuditLog.action == "PARAMETER_SET"))
                .scalars()
                .one()
            )
            assert entry.detail["value"] == "3000000"
            assert entry.detail["effective_from"] == "2025-04-01"
            assert verify_chain(session).ok is True

    def test_an_unknown_threshold_is_404(self, client: TestClient) -> None:
        response = client.put(
            "/api/v1/admin/parameters/OUT-99/invented",
            headers=COMMISSIONER,
            json={"value": "1", "effective_from": "2025-04-01"},
        )
        assert response.status_code == 404

    def test_a_field_officer_may_not_set_a_threshold(self, client: TestClient) -> None:
        response = client.put(
            "/api/v1/admin/parameters/OUT-01/amount_threshold",
            headers=STO,
            json={"value": "1", "effective_from": "2025-04-01"},
        )
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "ROLE_MAY_NOT_ADMINISTER"


class TestEngineReadsTheRegister:
    @pytest.mark.golden
    def test_the_engine_uses_the_administered_value(self, client: TestClient) -> None:
        """An edit in the register must change what the next run concludes."""
        client.get("/api/v1/admin/parameters", headers=COMMISSIONER)
        client.put(
            "/api/v1/admin/parameters/OUT-01/amount_threshold",
            headers=COMMISSIONER,
            json={"value": "9900000", "effective_from": "2020-04-01"},
        )
        with client.factory() as session:  # type: ignore[attr-defined]
            params = load_parameter_set(session)
            resolved = params.get("OUT-01", "amount_threshold", on=date(2025, 7, 1))
            assert resolved.raw == "9900000"
            assert params.version.startswith("register-")

    def test_an_empty_register_falls_back_to_the_shipped_values(self, client: TestClient) -> None:
        with client.factory() as session:  # type: ignore[attr-defined]
            params = load_parameter_set(session)
            assert params.version == "defaults"
            assert params.get("OUT-01", "pct_threshold", on=date(2025, 7, 1)).raw == "20"

    def test_status_is_derived_from_the_evidence(self, client: TestClient) -> None:
        """A row cannot claim an authority its own columns do not show."""
        row = RuleParameter(
            id="x",
            rule_or_param_id="OUT-01",
            key="k",
            value="1",
            value_type="decimal",
            effective_from=date(2025, 4, 1),
            provisional=True,
        )
        assert status_of(row) == STATUS_PROVISIONAL
        row.provisional = False
        row.approved_by = "commissioner.mh"
        assert status_of(row) == STATUS_DEPARTMENT
        row.notification_ref = "Notification 1/2025"
        assert status_of(row) == STATUS_NOTIFIED


class TestTheGapScreenAgreesWithTheRegister:
    """S3 shows a count of unadopted thresholds above the register listing them.

    The count used to be read from the values the platform shipped with, so
    after the department adopted all 106 the tile still said 106 were awaiting
    adoption while the register immediately below said none were. A screen
    whose entire job is to report what is unresolved must not itself be the
    thing that is out of date.
    """

    @pytest.mark.golden
    def test_adopting_everything_empties_the_tile(self, client: TestClient) -> None:
        before = client.get("/api/v1/admin/gaps", headers=COMMISSIONER).json()
        assert before["provisional_thresholds"]["count"] > 100

        client.post(
            "/api/v1/admin/parameters/adopt",
            headers=COMMISSIONER,
            json={"acknowledgement": "Adopted for the FY 2025-26 scrutiny cycle."},
        )

        after = client.get("/api/v1/admin/gaps", headers=COMMISSIONER).json()
        assert after["provisional_thresholds"]["count"] == 0
        assert after["provisional_thresholds"]["items"] == []

    def test_the_tile_and_the_register_report_the_same_number(self, client: TestClient) -> None:
        client.put(
            "/api/v1/admin/parameters/OUT-01/pct_threshold",
            headers=COMMISSIONER,
            json={
                "value": "25",
                "effective_from": "2025-10-01",
                "notification_ref": "Notification 26/2022-CT dated 26.12.2022",
            },
        )
        gaps = client.get("/api/v1/admin/gaps", headers=COMMISSIONER).json()
        register = client.get("/api/v1/admin/parameters", headers=COMMISSIONER).json()
        assert gaps["provisional_thresholds"]["count"] == register["by_status"].get(
            STATUS_PROVISIONAL, 0
        )

    def test_a_dark_parameter_is_not_confused_with_an_unadopted_threshold(
        self, client: TestClient
    ) -> None:
        """Three different problems, counted separately, never averaged."""
        body = client.get("/api/v1/admin/gaps", headers=COMMISSIONER).json()
        assert body["dark_parameters"]["count"] == 10
        assert body["unconfigured_statutory"]["count"] > 0
        assert body["provisional_thresholds"]["count"] > 0
