"""The Phase 0 API surface: health, the unconfigured list, and the 501 contract."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.canonical import UNCONFIGURED
from app.main import COMING_SOON, create_app


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_app())


def test_health(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    # A run is identified by the engine and parameter versions it used.
    assert body["engine_version"]
    assert body["params_version"]


def test_the_parameters_version_says_the_defaults_are_unapproved(client: TestClient) -> None:
    """The flag cut-offs are platform defaults awaiting the law officer, and the
    API says so rather than implying departmental policy."""
    assert client.get("/api/v1/health").json()["params_version"] == "unapproved-defaults"


def test_unconfigured_lists_every_known_statutory_gap(client: TestClient) -> None:
    response = client.get("/api/v1/admin/unconfigured")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == len(UNCONFIGURED)
    for item in body["items"]:
        assert item["status"] == "AWAITING_STATUTORY_CONFIRMATION"
        assert item["missing"]
        assert item["todo_ref"]


@pytest.mark.golden
@pytest.mark.parametrize("name", sorted(COMING_SOON))
def test_a_coming_soon_integration_returns_501_and_no_data(client: TestClient, name: str) -> None:
    """docs/03 section 7: real routed screens, APIs returning 501 with a roadmap
    reference and the parameters each unlocks.  No fabricated data, ever."""
    response = client.get(f"/api/v1/integrations/{name}/status")
    assert response.status_code == 501
    body = response.json()
    assert body["code"] == "NOT_IMPLEMENTED"
    assert body["roadmap_ref"]
    assert body["capability"]
    assert "unlocks" in body
    # Nothing that could be read as a result.
    assert not any(key in body for key in ("value", "count", "taxpayers", "amount"))


def test_the_external_parameters_are_all_claimed_by_some_integration() -> None:
    """The ten parameters that are dark without an external feed must each have
    a named owner, or the P-coverage story on the dashboard has a hole in it."""
    external = {"P02", "P15", "P20", "P23", "P25", "P26", "P27", "P28", "P33", "P34"}
    claimed = {param for module in COMING_SOON.values() for param in module["unlocks"]}
    assert external <= claimed, f"unclaimed: {sorted(external - claimed)}"


def test_an_unknown_integration_is_404_not_501(client: TestClient) -> None:
    response = client.get("/api/v1/integrations/nonesuch/status")
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_the_integration_index_lists_every_module(client: TestClient) -> None:
    response = client.get("/api/v1/integrations")
    assert response.status_code == 200
    assert {item["id"] for item in response.json()["items"]} == set(COMING_SOON)


def test_openapi_is_served(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    assert response.json()["info"]["title"] == "GST Intelligence"
