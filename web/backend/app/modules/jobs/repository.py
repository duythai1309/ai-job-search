from __future__ import annotations

from typing import Any

from app.db.supabase_client import get_supabase_service_client


class JobsRepositoryError(RuntimeError):
    pass


class JobsSchemaCompatibilityError(JobsRepositoryError):
    pass


INGESTION_SCHEMA_COLUMNS = ("source_job_id", "raw_payload")


def normalize_cloud_job_row(row: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(row)
    normalized["id"] = str(row["id"])
    normalized["skills"] = row.get("skills") or row.get("skills_required") or []
    normalized["apply_url"] = row.get("apply_url") or row.get("url")
    normalized["raw_payload"] = row.get("raw_payload") or row.get("raw_data")
    normalized["is_seeded"] = bool(row.get("is_seeded", False))
    normalized["availability_status"] = str(
        row.get("availability_status") or "active"
    )
    normalized["source_tier"] = int(row.get("source_tier") or 1)
    normalized["level"] = str(row.get("level") or "")
    return normalized


def prepare_cloud_job_payload(job: dict[str, Any]) -> dict[str, Any]:
    payload = dict(job)
    job_id = str(payload["id"])
    apply_url = payload.get("apply_url")
    skills = list(payload.get("skills") or [])
    raw_payload = payload.get("raw_payload")
    payload["url"] = apply_url or f"https://vica.invalid/jobs/{job_id}"
    payload["skills_required"] = skills
    payload["raw_data"] = raw_payload
    payload["employment_type"] = payload.get("employment_type") or None
    return payload


def _is_missing_ingestion_schema_error(exc: Exception) -> bool:
    message = str(exc).casefold()
    return any(column in message for column in INGESTION_SCHEMA_COLUMNS) and any(
        marker in message
        for marker in ("column", "schema cache", "pgrst", "does not exist")
    )


class JobsRepository:
    def __init__(self, client_provider: Any | None = None) -> None:
        self._client_provider = client_provider or get_supabase_service_client

    def list_jobs(self, limit: int = 20) -> list[dict[str, Any]]:
        try:
            response = (
                self._client_provider()
                .table("job_postings")
                .select("*")
                .limit(limit)
                .execute()
            )
        except Exception as exc:
            raise JobsRepositoryError("Job listing failed.") from exc
        return [normalize_cloud_job_row(row) for row in response.data or []]

    def get_by_id(self, job_id: str) -> dict[str, Any] | None:
        try:
            response = (
                self._client_provider()
                .table("job_postings")
                .select("*")
                .eq("id", job_id)
                .maybe_single()
                .execute()
            )
        except Exception as exc:
            raise JobsRepositoryError("Job lookup failed.") from exc
        return normalize_cloud_job_row(response.data) if response.data else None

    def upsert_jobs(self, jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not jobs:
            return []
        payloads = [prepare_cloud_job_payload(job) for job in jobs]
        try:
            response = (
                self._client_provider()
                .table("job_postings")
                .upsert(payloads, on_conflict="source,source_job_id")
                .execute()
            )
        except Exception as exc:
            if _is_missing_ingestion_schema_error(exc):
                raise JobsSchemaCompatibilityError(
                    "Supabase schema missing source_job_id/raw_payload; "
                    "apply additive migration first."
                ) from exc
            raise JobsRepositoryError("Job ingestion persistence failed.") from exc
        return [normalize_cloud_job_row(row) for row in response.data or []]
