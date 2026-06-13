from __future__ import annotations

import json
from uuid import uuid4

from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.modules.jobs.schemas import JobDetailResponse, JobRecord
from app.modules.ai.adapter import AIAdapterError, AITextResult
from app.modules.recommendations.router import get_recommendation_service
from app.modules.recommendations.service import RecommendationService


client = TestClient(app)


class FakeCvRepository:
    def __init__(self, cv_id: str) -> None:
        self.cv = {
            "id": cv_id,
            "extracted_text": "Backend student project using Python, FastAPI, SQL and Git.",
        }

    def get_by_id(self, cv_id: str, user_id: str):
        return self.cv if self.cv["id"] == cv_id else None


class FakeJobsService:
    def get_job(self, job_id: str):
        return JobDetailResponse(
            data=JobRecord(
                id=job_id,
                source="seed",
                source_tier=3,
                is_seeded=True,
                availability_status="sample",
                title="Backend Intern",
                company="Example",
                location="Hanoi",
                employment_type="internship",
                level="student",
                skills=["Python", "Docker"],
                description="Build Python services and use Docker.",
            )
        )


class FakeRecommendationsRepository:
    def __init__(self) -> None:
        self.saved = []

    def create(self, payload):
        self.saved.append(dict(payload))
        return dict(payload)


@pytest.fixture
def recommendation_dependencies():
    cv_id = uuid4()
    repository = FakeRecommendationsRepository()
    service = RecommendationService(
        repository=repository,
        cv_repository=FakeCvRepository(str(cv_id)),
        jobs_service=FakeJobsService(),
    )
    app.dependency_overrides[get_recommendation_service] = lambda: service
    yield cv_id, repository
    app.dependency_overrides.clear()


def test_recommendations_are_grounded_and_persisted(recommendation_dependencies):
    cv_id, repository = recommendation_dependencies

    response = client.post(
        "/api/v1/recommendations",
        json={"cv_id": str(cv_id), "job_id": "job-1"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["data"]["schema_version"] == "recommendation_v1"
    assert body["data"]["priority"] in (["high"], ["medium"], ["low"])
    assert body["data"]["priority_level"] == body["data"]["priority"][0]
    assert body["meta"]["generator"] == "grounded_deterministic_v1"
    assert repository.saved
    suggestions = body["data"]["suggestions"]
    assert any("Python" in item["cv_evidence"] for item in suggestions)
    docker = next(item for item in suggestions if "Docker" in item["action"])
    assert "No explicit evidence" in docker["cv_evidence"]
    assert docker["prohibited_claims"]


def test_recommendations_reject_unknown_fields(recommendation_dependencies):
    cv_id, _ = recommendation_dependencies

    response = client.post(
        "/api/v1/recommendations",
        json={"cv_id": str(cv_id), "job_id": "job-1", "score": 99},
    )

    assert response.status_code == 422
    assert response.json()["error"] == {
        "code": "invalid_request",
        "message": "The request payload or parameters are invalid.",
    }


VALID_GENERATION = {
    "suggestions": [
        {
            "target_section": "Projects",
            "action": "Surface the verified Python project.",
            "reason": "It matches the selected backend role.",
            "cv_evidence": "Python, FastAPI, SQL",
            "job_evidence": "Backend Intern",
            "prohibited_claims": ["Do not invent project outcomes."],
        }
    ],
    "priority": "high",
    "warnings": ["Verify wording before applying."],
}


class FakeRecommendationAIAdapter:
    def __init__(self, first: str, repaired: str | None = None) -> None:
        self.first = first
        self.repaired = repaired
        self.generate_calls = 0
        self.repair_calls = 0

    def generate_recommendations(self, *, cv_text, job, schema):
        self.generate_calls += 1
        assert "Python, FastAPI, SQL" in cv_text
        assert job["title"] == "Backend Intern"
        return AITextResult(self.first, "fake-gemini")

    def repair_recommendations(
        self,
        *,
        cv_text,
        job,
        invalid_output,
        validation_errors,
        schema,
    ):
        self.repair_calls += 1
        if self.repaired is None:
            raise AIAdapterError("provider unavailable")
        return AITextResult(self.repaired, "fake-gemini-repair")


def _provider_service(cv_id, adapter):
    return RecommendationService(
        repository=FakeRecommendationsRepository(),
        cv_repository=FakeCvRepository(str(cv_id)),
        jobs_service=FakeJobsService(),
        ai_adapter=adapter,
    )


def test_recommendation_provider_success(recommendation_dependencies):
    cv_id, _ = recommendation_dependencies
    adapter = FakeRecommendationAIAdapter(json.dumps(VALID_GENERATION))
    app.dependency_overrides[get_recommendation_service] = lambda: _provider_service(
        cv_id, adapter
    )

    response = client.post(
        "/api/v1/recommendations",
        json={"cv_id": str(cv_id), "job_id": "job-1"},
    )

    assert response.status_code == 201
    assert response.json()["meta"]["generator"] == "fake-gemini"
    assert adapter.repair_calls == 0


def test_recommendation_provider_repairs_once(recommendation_dependencies):
    cv_id, _ = recommendation_dependencies
    adapter = FakeRecommendationAIAdapter(
        "not-json",
        json.dumps(VALID_GENERATION),
    )
    app.dependency_overrides[get_recommendation_service] = lambda: _provider_service(
        cv_id, adapter
    )

    response = client.post(
        "/api/v1/recommendations",
        json={"cv_id": str(cv_id), "job_id": "job-1"},
    )

    assert response.status_code == 201
    assert adapter.generate_calls == 1
    assert adapter.repair_calls == 1


def test_recommendation_provider_rejects_invalid_repair(
    recommendation_dependencies,
):
    cv_id, _ = recommendation_dependencies
    adapter = FakeRecommendationAIAdapter("not-json", '{"suggestions":[]}')
    app.dependency_overrides[get_recommendation_service] = lambda: _provider_service(
        cv_id, adapter
    )

    response = client.post(
        "/api/v1/recommendations",
        json={"cv_id": str(cv_id), "job_id": "job-1"},
    )

    assert response.status_code == 502
    assert response.json()["code"] == "recommendation_invalid_output"
    assert adapter.repair_calls == 1


def test_recommendation_provider_error_is_sanitized(
    recommendation_dependencies,
):
    cv_id, _ = recommendation_dependencies

    class FailingAdapter(FakeRecommendationAIAdapter):
        def generate_recommendations(self, **kwargs):
            raise AIAdapterError(
                "secret-key and raw CV: Backend student project using Python"
            )

    app.dependency_overrides[get_recommendation_service] = lambda: _provider_service(
        cv_id, FailingAdapter("")
    )

    response = client.post(
        "/api/v1/recommendations",
        json={"cv_id": str(cv_id), "job_id": "job-1"},
    )

    assert response.status_code == 503
    body = response.text
    assert "secret-key" not in body
    assert "Backend student project" not in body
