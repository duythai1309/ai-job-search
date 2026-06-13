from __future__ import annotations

from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.modules.jobs.repository import JobsRepositoryError
from app.modules.jobs.router import get_jobs_service
from app.modules.jobs.service import JobsService


client = TestClient(app)


SEED_JOBS = [
    {
        "id": "seed-1",
        "source": "seed",
        "source_tier": 3,
        "is_seeded": True,
        "availability_status": "sample",
        "title": "Backend Intern",
        "company": "Example Vietnam",
        "location": "Hanoi",
        "employment_type": "internship",
        "level": "student",
        "skills": ["Python", "FastAPI"],
        "description": "Backend internship.",
        "apply_url": "https://must-not-be-exposed.example",
        "posted_at": "2026-01-01",
        "salary_range": "stipend",
    }
]


class FakeJobsRepository:
    def __init__(self, jobs=None, fail=False):
        self.jobs = jobs or []
        self.fail = fail

    def list_jobs(self, limit=20):
        if self.fail:
            raise JobsRepositoryError("offline")
        return self.jobs[:limit]

    def get_by_id(self, job_id):
        if self.fail:
            raise JobsRepositoryError("offline")
        return next((job for job in self.jobs if job["id"] == job_id), None)


class FakeSeedSource:
    def list_jobs(self):
        return list(SEED_JOBS)

    def get_by_id(self, job_id):
        return next((job for job in SEED_JOBS if job["id"] == job_id), None)


@pytest.fixture(autouse=True)
def jobs_service_override():
    repository = FakeJobsRepository(fail=True)
    service = JobsService(repository=repository, seed_source=FakeSeedSource())
    app.dependency_overrides[get_jobs_service] = lambda: service
    yield
    app.dependency_overrides.clear()


def test_jobs_fall_back_to_seeded_data():
    response = client.get("/api/v1/jobs")

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["jobs"][0]["id"] == "seed-1"
    assert body["data"]["jobs"][0]["is_seeded"] is True
    assert body["data"]["jobs"][0]["availability_status"] == "sample"
    assert body["data"]["jobs"][0]["apply_url"] is None
    assert body["meta"]["fallback_used"] is True


def test_jobs_support_filters():
    assert client.get("/api/v1/jobs?q=python").json()["meta"]["total"] == 1
    assert client.get("/api/v1/jobs?location=Da%20Nang").json()["meta"]["total"] == 0
    assert client.get("/api/v1/jobs?role_type=intern").json()["meta"]["total"] == 1


def test_job_detail_uses_seed_fallback():
    response = client.get("/api/v1/jobs/seed-1")

    assert response.status_code == 200
    assert response.json()["data"]["title"] == "Backend Intern"


def test_job_detail_returns_safe_not_found():
    response = client.get("/api/v1/jobs/missing")

    assert response.status_code == 404
    assert response.json()["code"] == "job_not_found"


def test_supabase_jobs_take_precedence():
    live_job = {
        **SEED_JOBS[0],
        "id": "live-1",
        "source": "approved_feed",
        "source_tier": 1,
        "is_seeded": False,
        "availability_status": "active",
        "apply_url": "https://jobs.example/apply",
    }
    service = JobsService(
        repository=FakeJobsRepository([live_job]),
        seed_source=FakeSeedSource(),
    )
    app.dependency_overrides[get_jobs_service] = lambda: service

    body = client.get("/api/v1/jobs").json()

    assert body["data"]["jobs"][0]["id"] == "live-1"
    assert body["meta"]["fallback_used"] is False
