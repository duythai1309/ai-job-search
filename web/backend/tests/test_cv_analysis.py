from __future__ import annotations

import json
from uuid import uuid4

from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.modules.ai.adapter import AIAdapterError, AITextResult
from app.modules.cv_analysis.repository import CvAnalysisRepositoryError
from app.modules.cv_analysis.router import get_cv_analysis_service
from app.modules.cv_analysis.schemas import CandidateProfileV1
from app.modules.cv_analysis.service import CvAnalysisService


client = TestClient(app)


VALID_PROFILE = {
    "summary": "Second-year software student with backend project experience.",
    "target_roles": ["Backend Intern"],
    "skills": {
        "technical": ["Python", "SQL"],
        "tools": ["Git"],
        "soft": ["Teamwork"],
        "languages": ["Vietnamese", "English"],
    },
    "education": [
        {
            "institution": "Example University",
            "degree": "Bachelor",
            "field_of_study": "Computer Science",
            "start_date": "2024",
            "end_date": None,
            "details": [],
        }
    ],
    "experience": [],
    "projects": [
        {
            "name": "Career Platform",
            "description": "Built a FastAPI prototype.",
            "technologies": ["FastAPI"],
            "highlights": [],
        }
    ],
    "certifications": [],
    "strengths": ["Backend fundamentals"],
    "gaps": ["No employment experience stated"],
}


class FakeCvAnalysisRepository:
    def __init__(self, cv_id: str) -> None:
        self.cv_document = {
            "id": cv_id,
            "extracted_text": "UNTRUSTED CV DATA: Python, SQL, FastAPI project.",
        }
        self.analysis_records = []
        self.fail_create = False

    def get_cv_document(self, cv_id: str):
        if self.cv_document is None or self.cv_document["id"] != cv_id:
            return None
        return dict(self.cv_document)

    def create_analysis(self, payload: dict):
        if self.fail_create:
            raise CvAnalysisRepositoryError("fake persistence failure")
        self.analysis_records.append(dict(payload))
        return dict(payload)


class FakeAIAdapter:
    def __init__(self, first_output: str, repair_output: str | None = None):
        self.first_output = first_output
        self.repair_output = repair_output
        self.generate_calls = 0
        self.repair_calls = 0
        self.received_cv_text = None

    def generate_candidate_profile(self, *, cv_text, schema):
        self.generate_calls += 1
        self.received_cv_text = cv_text
        assert schema["additionalProperties"] is False
        return AITextResult(self.first_output, "fake-model")

    def repair_candidate_profile(
        self,
        *,
        cv_text,
        invalid_output,
        validation_errors,
        schema,
    ):
        self.repair_calls += 1
        assert cv_text == self.received_cv_text
        if self.repair_output is None:
            raise AIAdapterError("repair unavailable")
        return AITextResult(self.repair_output, "fake-repair-model")


@pytest.fixture
def analysis_dependencies():
    cv_id = uuid4()
    repository = FakeCvAnalysisRepository(str(cv_id))
    adapter = FakeAIAdapter(json.dumps(VALID_PROFILE))
    app.dependency_overrides[get_cv_analysis_service] = lambda: CvAnalysisService(
        repository=repository,
        ai_adapter=adapter,
    )
    yield cv_id, repository, adapter
    app.dependency_overrides.clear()


def test_create_cv_analysis_persists_validated_profile(analysis_dependencies):
    cv_id, repository, adapter = analysis_dependencies

    response = client.post("/api/v1/cv-analyses", json={"cv_id": str(cv_id)})

    assert response.status_code == 201
    body = response.json()
    assert body["data"]["cv_id"] == str(cv_id)
    assert body["data"]["analysis_id"] == repository.analysis_records[0]["id"]
    assert body["data"]["schema_version"] == "candidate_profile_v1"
    assert body["data"]["profile"] == VALID_PROFILE
    assert body["meta"]["persisted"] is True
    assert body["error"] is None
    assert repository.analysis_records[0]["validation_state"] == "validated"
    assert repository.analysis_records[0]["model_name"] == "fake-model"
    assert adapter.repair_calls == 0
    assert adapter.received_cv_text.startswith("UNTRUSTED CV DATA:")


def test_create_cv_analysis_repairs_invalid_json_once(analysis_dependencies):
    cv_id, repository, _ = analysis_dependencies
    adapter = FakeAIAdapter("not json", json.dumps(VALID_PROFILE))
    app.dependency_overrides[get_cv_analysis_service] = lambda: CvAnalysisService(
        repository=repository,
        ai_adapter=adapter,
    )

    response = client.post("/api/v1/cv-analyses", json={"cv_id": str(cv_id)})

    assert response.status_code == 201
    assert adapter.generate_calls == 1
    assert adapter.repair_calls == 1
    assert len(repository.analysis_records) == 1
    assert repository.analysis_records[0]["model_name"] == "fake-repair-model"


def test_create_cv_analysis_rejects_invalid_repair(analysis_dependencies):
    cv_id, repository, _ = analysis_dependencies
    adapter = FakeAIAdapter("not json", '{"summary": 123}')
    app.dependency_overrides[get_cv_analysis_service] = lambda: CvAnalysisService(
        repository=repository,
        ai_adapter=adapter,
    )

    response = client.post("/api/v1/cv-analyses", json={"cv_id": str(cv_id)})

    assert response.status_code == 502
    assert response.json()["code"] == "cv_analysis_invalid_output"
    assert adapter.repair_calls == 1
    assert repository.analysis_records == []


def test_create_cv_analysis_rejects_unknown_profile_fields(analysis_dependencies):
    cv_id, repository, _ = analysis_dependencies
    invalid_profile = {**VALID_PROFILE, "fit_score": 99}
    adapter = FakeAIAdapter(
        json.dumps(invalid_profile),
        json.dumps(invalid_profile),
    )
    app.dependency_overrides[get_cv_analysis_service] = lambda: CvAnalysisService(
        repository=repository,
        ai_adapter=adapter,
    )

    response = client.post("/api/v1/cv-analyses", json={"cv_id": str(cv_id)})

    assert response.status_code == 502
    assert repository.analysis_records == []


def test_create_cv_analysis_returns_not_found(analysis_dependencies):
    cv_id, repository, _ = analysis_dependencies
    repository.cv_document = None

    response = client.post("/api/v1/cv-analyses", json={"cv_id": str(cv_id)})

    assert response.status_code == 404
    assert response.json()["code"] == "cv_not_found"


def test_create_cv_analysis_reports_persistence_failure(analysis_dependencies):
    cv_id, repository, _ = analysis_dependencies
    repository.fail_create = True

    response = client.post("/api/v1/cv-analyses", json={"cv_id": str(cv_id)})

    assert response.status_code == 503
    assert response.json()["code"] == "cv_analysis_persistence_failed"


def test_candidate_profile_schema_forbids_extra_fields():
    with pytest.raises(ValueError):
        CandidateProfileV1.model_validate({**VALID_PROFILE, "score_total": 95})


def test_provider_error_does_not_log_or_return_raw_cv(
    analysis_dependencies,
    caplog,
):
    cv_id, repository, _ = analysis_dependencies
    repository.cv_document["extracted_text"] = "RAW-CV-SECRET-SENTINEL"

    class FailingAdapter:
        def generate_candidate_profile(self, **kwargs):
            raise AIAdapterError(
                "provider failed with RAW-CV-SECRET-SENTINEL and secret-key"
            )

        def repair_candidate_profile(self, **kwargs):
            raise AssertionError("repair must not run after provider failure")

    app.dependency_overrides[get_cv_analysis_service] = lambda: CvAnalysisService(
        repository=repository,
        ai_adapter=FailingAdapter(),
    )

    response = client.post("/api/v1/cv-analyses", json={"cv_id": str(cv_id)})

    assert response.status_code == 503
    assert response.json()["code"] == "ai_provider_unavailable"
    assert "RAW-CV-SECRET-SENTINEL" not in response.text
    assert "secret-key" not in response.text
    assert "RAW-CV-SECRET-SENTINEL" not in caplog.text
    assert "secret-key" not in caplog.text
