from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_reports_application_version() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["version"]


def test_validation_endpoint_reports_missing_columns_and_duplicates() -> None:
    payload = {
        "required_columns": ["region", "yield_t_ha"],
        "rows": [
            {"region": "US-IA", "yield_t_ha": 4.2},
            {"region": "US-IA", "yield_t_ha": 4.2},
            {"region": "US-IL", "yield_t_ha": None},
        ],
    }

    with TestClient(app) as client:
        response = client.post("/api/data/validate", json=payload)

    assert response.status_code == 200
    assert response.json() == {
        "valid": True,
        "rows_received": 3,
        "columns": ["region", "yield_t_ha"],
        "missing_required_columns": [],
        "duplicate_rows": 1,
        "missing_values": {"region": 0, "yield_t_ha": 1},
        "errors": [],
    }
