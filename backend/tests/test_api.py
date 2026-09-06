from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_samples_endpoint():
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) >= 3
    sample_ids = [s["id"] for s in samples]
    assert "iris.csv" in sample_ids
    assert "weather_nominal.arff" in sample_ids

def test_login_and_auth():
    # Login as pre-seeded Aditya
    response = client.post("/api/auth/login", json={
        "email": "aditya@nitk.ac.in",
        "password": "Aditya@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    token = data["access_token"]

    # Test /api/auth/me with bearer token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "aditya@nitk.ac.in"

def test_convert_api_execution():
    csv_sample = "attr1,attr2,target\n1.0,2.0,yes\n3.0,4.0,no\n"
    response = client.post(
        "/api/convert/execute",
        files={"file": ("test.csv", csv_sample.encode("utf-8"), "text/csv")},
        data={"relation_name": "test_rel", "source_format": "csv", "target_format": "arff"}
    )
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["instance_count"] == 2
    assert res["attribute_count"] == 3
    assert "@relation test_rel" in res["full_output"]
    assert "@attribute target {no,yes}" in res["full_output"]
