from __future__ import annotations

from typing import Any

from app.core.config import ConfigError
from app.db.fallback_store import fallback_store
from app.db.supabase_client import get_supabase_service_client


class MatchingRepositoryError(RuntimeError):
    pass


class MatchingRepository:
    def __init__(self, client_provider: Any | None = None) -> None:
        self._client_provider = client_provider or get_supabase_service_client

    def get_analysis(self, analysis_id: str) -> dict[str, Any] | None:
        try:
            response = (
                self._client_provider()
                .table("cv_analyses")
                .select("id,cv_id,schema_version,profile_json")
                .eq("id", analysis_id)
                .maybe_single()
                .execute()
            )
        except ConfigError:
            return fallback_store.get("cv_analyses", analysis_id)
        except Exception as exc:
            raise MatchingRepositoryError("CV analysis lookup failed.") from exc
        return response.data

    def get_latest_analysis_for_cv(self, cv_id: str) -> dict[str, Any] | None:
        try:
            response = (
                self._client_provider()
                .table("cv_analyses")
                .select("id,cv_id,schema_version,profile_json,created_at")
                .eq("cv_id", cv_id)
                .order("created_at", desc=True)
                .limit(1)
                .maybe_single()
                .execute()
            )
        except ConfigError:
            return fallback_store.latest_by("cv_analyses", "cv_id", cv_id)
        except Exception as exc:
            raise MatchingRepositoryError("CV analysis lookup failed.") from exc
        return response.data

    def create_matches(self, payloads: list[dict[str, Any]]) -> list[dict[str, Any]]:
        try:
            response = (
                self._client_provider()
                .table("job_matches")
                .insert(payloads)
                .execute()
            )
        except ConfigError:
            return [
                fallback_store.put("job_matches", payload) for payload in payloads
            ]
        except Exception as exc:
            raise MatchingRepositoryError("Fit score persistence failed.") from exc
        if not response.data:
            raise MatchingRepositoryError("Fit score persistence returned no records.")
        return response.data
