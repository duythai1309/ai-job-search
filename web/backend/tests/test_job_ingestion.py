from app.core.config import Settings
from app.modules.jobs.ingestion_service import JobIngestionService, LiveIngestionDisabledError
from app.modules.jobs.normalizer import dedupe_jobs, is_relevant_tech_job, normalize_job
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
