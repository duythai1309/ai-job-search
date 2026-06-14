from uuid import UUID

import pytest

from app.core.config import Settings
from app.modules.jobs.ingestion_service import (
    IngestionSchemaNotReadyError,
    JobIngestionService,
    LiveIngestionDisabledError,
)
from app.modules.jobs.normalizer import dedupe_jobs, is_relevant_tech_job, normalize_job
from app.modules.jobs.repository import (
    JobsRepository,
    JobsSchemaCompatibilityError,
    normalize_cloud_job_row,
)
from app.modules.jobs.sources.base import DisabledLiveSource, SourceJob
from app.modules.jobs.sources.linkedin import LinkedInSource


class FakeRepository:
    def __init__(self):
        self.jobs = []

    def upsert_jobs(self, jobs):
        self.jobs = jobs
        return jobs


class FakeSource:
    name = "fake"
    is_live = False

    def fetch(self, limit):
        return [
            SourceJob(source="fake", source_job_id="1", title="Data Engineer", company="A"),
            SourceJob(source="fake", source_job_id="2", title="Sales Executive", company="B"),
        ][:limit]


def settings(live=False):
    return Settings(
        "url", "anon", "service",
        enable_live_job_ingestion=live,
        enable_job_ingestion_endpoint=True,
    )


def test_normalizer_maps_canonical_fields():
    result = normalize_job(SourceJob(
        source="topcv", source_job_id="abc", title=" Backend Intern ", company=" VICA ",
        skills=["Python", "Python"], apply_url="https://example.test/job",
    ))
    assert result["title"] == "Backend Intern"
    assert result["skills"] == ["Python"]
    assert result["source_job_id"] == "abc"
    assert UUID(result["id"])


def test_normalizer_maps_unsupported_cloud_source_without_losing_provenance():
    result = normalize_job(
        SourceJob(source="seed", source_job_id="seed-1", title="AI Intern", company="VICA")
    )

    assert result["source"] == "other"
    assert result["raw_payload"]["original_source"] == "seed"


def test_filter_accepts_tech_and_rejects_unrelated_jobs():
    assert is_relevant_tech_job(SourceJob(source="x", title="AI Engineer", company="A"))
    assert not is_relevant_tech_job(SourceJob(source="x", title="HR Executive", company="A"))


def test_dedupe_prefers_source_job_id():
    job = normalize_job(SourceJob(source="x", source_job_id="same", title="Backend", company="A"))
    assert len(dedupe_jobs([job, dict(job)])) == 1


def test_ingestion_uses_fake_source_and_repository():
    repository = FakeRepository()
    service = JobIngestionService(repository, {"fake": FakeSource()}, settings())
    result = service.ingest(["fake"], 10)
    assert result.data.fetched_count == 2
    assert result.data.accepted_count == 1
    assert result.data.rejected_count == 1
    assert len(repository.jobs) == 1


def test_live_ingestion_is_disabled_by_default():
    source = DisabledLiveSource()
    source.name = "live"
    service = JobIngestionService(FakeRepository(), {"live": source}, settings())
    try:
        service.ingest(["live"])
    except LiveIngestionDisabledError:
        pass
    else:
        raise AssertionError("live ingestion should be disabled")


def test_linkedin_live_scraping_is_disabled():
    assert LinkedInSource().fetch(10) == []
    assert "disabled" in LinkedInSource.reason.casefold()


def test_old_cloud_job_fields_normalize_to_backend_contract():
    job_id = "7d840f7d-e499-49c9-84ed-2f8f217ad7bb"
    row = normalize_cloud_job_row(
        {
            "id": UUID(job_id),
            "source": "topcv",
            "title": "Backend Intern",
            "company": "VICA",
            "skills_required": ["Python", "SQL"],
            "url": "https://example.test/jobs/1",
            "raw_data": {"external": 1},
        }
    )

    assert row["id"] == job_id
    assert row["skills"] == ["Python", "SQL"]
    assert row["apply_url"] == "https://example.test/jobs/1"
    assert row["raw_payload"] == {"external": 1}
    assert row["is_seeded"] is False
    assert row["availability_status"] == "active"


def test_new_cloud_job_fields_take_precedence():
    row = normalize_cloud_job_row(
        {
            "id": "7d840f7d-e499-49c9-84ed-2f8f217ad7bb",
            "skills": ["FastAPI"],
            "skills_required": ["Legacy"],
            "apply_url": "https://example.test/new",
            "url": "https://example.test/old",
            "raw_payload": {"new": True},
            "raw_data": {"old": True},
            "is_seeded": False,
            "availability_status": "active",
        }
    )

    assert row["skills"] == ["FastAPI"]
    assert row["apply_url"] == "https://example.test/new"
    assert row["raw_payload"] == {"new": True}


class FailingSchemaRepository:
    def upsert_jobs(self, jobs):
        raise JobsSchemaCompatibilityError(
            "Supabase schema missing source_job_id/raw_payload; apply additive migration first."
        )


def test_missing_ingestion_columns_returns_clear_schema_error():
    service = JobIngestionService(
        FailingSchemaRepository(), {"fake": FakeSource()}, settings()
    )

    with pytest.raises(
        IngestionSchemaNotReadyError,
        match="apply additive migration first",
    ):
        service.ingest(["fake"], 10)


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeUpsertQuery:
    def __init__(self, response):
        self.response = response
        self.payloads = None
        self.on_conflict = None

    def upsert(self, payloads, on_conflict):
        self.payloads = payloads
        self.on_conflict = on_conflict
        return self

    def execute(self):
        return self.response


class FakeUpsertClient:
    def __init__(self, response):
        self.query = FakeUpsertQuery(response)

    def table(self, table_name):
        assert table_name == "job_postings"
        return self.query


class FailingUpsertQuery:
    def upsert(self, payloads, on_conflict):
        return self

    def execute(self):
        raise RuntimeError(
            "PGRST204: Could not find the 'source_job_id' column in the schema cache"
        )


class FailingUpsertClient:
    def table(self, table_name):
        return FailingUpsertQuery()


def test_ingestion_writes_old_and_new_cloud_columns():
    job = normalize_job(
        SourceJob(
            source="seed",
            source_job_id="seed-1",
            title="AI Intern",
            company="VICA",
            skills=["Python"],
            raw_payload={"seed_id": "seed-1"},
            is_seeded=True,
        )
    )
    client = FakeUpsertClient(FakeResponse([job]))
    repository = JobsRepository(client_provider=lambda: client)

    repository.upsert_jobs([job])

    payload = client.query.payloads[0]
    assert payload["skills"] == ["Python"]
    assert payload["skills_required"] == ["Python"]
    assert payload["raw_payload"] == {"seed_id": "seed-1", "original_source": "seed"}
    assert payload["raw_data"] == payload["raw_payload"]
    assert payload["url"].startswith("https://vica.invalid/jobs/")
    assert client.query.on_conflict == "source,source_job_id"


def test_repository_sanitizes_missing_cloud_ingestion_columns():
    repository = JobsRepository(client_provider=lambda: FailingUpsertClient())

    with pytest.raises(
        JobsSchemaCompatibilityError,
        match="apply additive migration first",
    ):
        repository.upsert_jobs(
            [
                normalize_job(
                    SourceJob(
                        source="topcv",
                        source_job_id="job-1",
                        title="Backend Intern",
                        company="VICA",
                    )
                )
            ]
        )
