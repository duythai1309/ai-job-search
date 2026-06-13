from __future__ import annotations

from app.core.config import Settings, get_settings
from app.modules.jobs.normalizer import dedupe_jobs, is_relevant_tech_job, normalize_job
from app.modules.jobs.repository import JobsRepository
from app.modules.jobs.schemas import JobIngestionResponse, JobIngestionSummary
from app.modules.jobs.sources.base import JobSource
from app.modules.jobs.sources.seed import SeedSourceAdapter
from app.modules.jobs.sources.topcv import TopCVSource
from app.modules.jobs.sources.itviec import ITViecSource
from app.modules.jobs.sources.vietnamworks import VietnamWorksSource
from app.modules.jobs.sources.careerviet import CareerVietSource
from app.modules.jobs.sources.linkedin import LinkedInSource


class LiveIngestionDisabledError(RuntimeError):
    pass


class IngestionEndpointDisabledError(RuntimeError):
    pass


class JobIngestionService:
    def __init__(self, repository=None, sources=None, settings: Settings | None = None):
        self._repository = repository or JobsRepository()
        self._settings = settings or get_settings()
        self._sources: dict[str, JobSource] = sources or {
            "seed": SeedSourceAdapter(),
            "topcv": TopCVSource(),
            "itviec": ITViecSource(),
            "vietnamworks": VietnamWorksSource(),
            "careerviet": CareerVietSource(),
            "linkedin": LinkedInSource(),
        }

    def ingest(self, requested_sources: list[str], limit: int | None = None) -> JobIngestionResponse:
        if not self._settings.enable_job_ingestion_endpoint:
            raise IngestionEndpointDisabledError()
        names = [name.casefold() for name in requested_sources]
        maximum = min(limit or self._settings.job_ingestion_max_results, self._settings.job_ingestion_max_results)
        fetched = []
        errors = 0
        for name in names:
            source = self._sources.get(name)
            if source is None:
                errors += 1
                continue
            if source.is_live and not self._settings.enable_live_job_ingestion:
                raise LiveIngestionDisabledError(name)
            try:
                fetched.extend(source.fetch(maximum))
            except Exception:
                errors += 1
        accepted_source = [job for job in fetched if is_relevant_tech_job(job)]
        normalized = dedupe_jobs([normalize_job(job) for job in accepted_source])[:maximum]
        persisted = self._repository.upsert_jobs(normalized)
        return JobIngestionResponse(
            data=JobIngestionSummary(
                fetched_count=len(fetched),
                accepted_count=len(normalized),
                rejected_count=len(fetched) - len(accepted_source),
                inserted_count=len(persisted),
                updated_count=0,
                error_count=errors,
                sources=names,
            )
        )
