"""
API integration tests using FastAPI TestClient.
"""
import json
import pytest
from fastapi.testclient import TestClient

# We import after sys.path is set by conftest
from app.main import app

client = TestClient(app, raise_server_exceptions=False)

VALID_INPUT = {
    "age": 63, "sex": 1, "cp": 1, "trestbps": 145, "chol": 233,
    "fbs": 1, "restecg": 2, "thalach": 150, "exang": 0,
    "oldpeak": 2.3, "slope": 3, "ca": 0, "thal": 6,
}


class TestHealthEndpoint:
    def test_health_returns_200(self):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200

    def test_health_schema(self):
        resp = client.get("/api/v1/health")
        data = resp.json()
        assert "status" in data
        assert "model_ready" in data
        assert "retrieval_ready" in data
        assert "llm_ready" in data

    def test_root_returns_200(self):
        resp = client.get("/")
        assert resp.status_code == 200


class TestModelEndpoints:
    def test_model_info_returns_200(self):
        resp = client.get("/api/v1/model/info")
        assert resp.status_code == 200

    def test_model_metrics_returns_200(self):
        resp = client.get("/api/v1/model/metrics")
        assert resp.status_code == 200

    def test_model_metrics_schema(self):
        resp = client.get("/api/v1/model/metrics")
        data = resp.json()
        assert "models" in data


class TestPredictionEndpoint:
    def test_invalid_input_returns_422(self):
        resp = client.post("/api/v1/predict", json={"age": -1})
        assert resp.status_code == 422

    def test_invalid_thal_returns_422(self):
        bad = {**VALID_INPUT, "thal": 99}
        resp = client.post("/api/v1/predict", json=bad)
        assert resp.status_code == 422

    def test_predict_with_valid_input(self):
        resp = client.post("/api/v1/predict", json=VALID_INPUT)
        # Either 200 (model loaded) or 503 (models not yet trained — acceptable in CI)
        assert resp.status_code in (200, 503)
        if resp.status_code == 200:
            data = resp.json()
            assert data["predicted_class"] in (0, 1)
            assert "disclaimer" in data

    def test_predict_response_schema(self):
        resp = client.post("/api/v1/predict", json=VALID_INPUT)
        if resp.status_code == 200:
            data = resp.json()
            assert "predicted_class" in data
            assert "interpretation" in data
            assert "model_name" in data


class TestRAGEndpoints:
    def test_retrieve_returns_200_or_503(self):
        resp = client.post(
            "/api/v1/rag/retrieve",
            json={"query": "What are the risk factors for heart disease?", "top_k": 3},
        )
        assert resp.status_code in (200, 503)

    def test_retrieve_schema(self):
        resp = client.post(
            "/api/v1/rag/retrieve",
            json={"query": "cholesterol and heart disease"},
        )
        if resp.status_code == 200:
            data = resp.json()
            assert "passages" in data
            assert "n_retrieved" in data

    def test_chat_endpoint_exists(self):
        resp = client.post("/api/v1/chat", json={"query": "What is cholesterol?"})
        assert resp.status_code in (200, 503)

    def test_knowledge_sources_returns_list(self):
        resp = client.get("/api/v1/knowledge/sources")
        assert resp.status_code == 200
        data = resp.json()
        assert "sources" in data
        assert data["total"] > 0


class TestInputValidation:
    def test_predict_missing_required_field(self):
        incomplete = {k: v for k, v in VALID_INPUT.items() if k != "age"}
        resp = client.post("/api/v1/predict", json=incomplete)
        assert resp.status_code == 422

    def test_predict_field_out_of_range(self):
        bad = {**VALID_INPUT, "trestbps": 999}
        resp = client.post("/api/v1/predict", json=bad)
        assert resp.status_code == 422

    def test_chat_query_too_short(self):
        resp = client.post("/api/v1/chat", json={"query": "hi"})
        assert resp.status_code == 422
