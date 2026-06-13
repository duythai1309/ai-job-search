from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.modules.cv_analysis.schemas import CandidateProfileV1
from app.modules.jobs.schemas import JobDetailResponse, JobRecord
from app.modules.matching.router import get_matching_service
from app.modules.matching.scorer import score_candidate
from app.modules.matching.service import MatchingService


client = TestClient(app)


PROFILE = {
    "summary": "Backend student",
    "target_roles": ["Backend Intern"],
    "skills": {
        "technical": ["Python", "SQL"],
        "tools": ["Git"],
        "soft": ["Teamwork"],
        "languages": ["Vietnamese"],
    },
    "education": [{"institution": "Example University"}],
    "experience": [],
    "projects": [],
    "certifications": [],
    "strengths": [],
    "gaps": [],
}


def make_job(job_id, skills):
    return JobRecord(
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
        skills=skills,
        description="Backend role",
    )


class FakeMatchingRepository:
    def __init__(self, analysis_id):
        self.analysis = {
            "id": str(analysis_id),
            "profile_json": PROFILE,
        }
        self.saved = []

    def get_analysis(self, analysis_id):
        return self.analysis if self.analysis["id"] == analysis_id else None

    def create_matches(self, payloads):
        self.saved.extend(payloads)
        return [dict(payload) for payload in payloads]


class FakeJobsService:
    def __init__(self):
        self.jobs = {
            "job-good": make_job("job-good", ["Python", "SQL"]),
            "job-gap": make_job("job-gap", ["Python", "Java", "Docker"]),
        }

    def get_job(self, job_id):
        return JobDetailResponse(data=self.jobs[job_id])


@pytest.fixture
def matching_dependencies():
    analysis_id = uuid4()
    repository = FakeMatchingRepository(analysis_id)
    service = MatchingService(repository, FakeJobsService())
    app.dependency_overrides[get_matching_service] = lambda: service
    yield analysis_id, repository
    app.dependency_overrides.clear()


def test_fit_score_endpoint_persists_multiple_deterministic_results(
    matching_dependencies,
):
    analysis_id, repository = matching_dependencies

    response = client.post(
        "/api/v1/fit-scores",
        json={"analysis_id": str(analysis_id), "job_ids": ["job-good", "job-gap"]},
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body["data"]["results"]) == 2
    assert body["data"]["results"][0]["score"] > body["data"]["results"][1]["score"]
    assert body["meta"] == {"persisted": True, "count": 2}
    assert len(repository.saved) == 2


def test_same_input_produces_same_score_and_fingerprint():
    profile = CandidateProfileV1.model_validate(PROFILE)
    job = make_job("job-good", ["Python", "SQL"])

    first = score_candidate(profile, job)
    second = score_candidate(profile, job)

    assert first == second


def test_missing_skills_lower_score_and_are_reported():
    profile = CandidateProfileV1.model_validate(PROFILE)
    full_match = score_candidate(profile, make_job("a", ["Python", "SQL"]))
    partial_match = score_candidate(
        profile,
        make_job("b", ["Python", "Java", "Docker"]),
    )

    assert full_match[0] > partial_match[0]
    assert partial_match[3] == ["Docker", "Java"]


def test_matching_module_has_no_ai_dependency():
    import app.modules.matching.scorer as scorer

    assert "ai" not in scorer.__dict__
