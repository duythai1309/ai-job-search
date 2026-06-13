from __future__ import annotations

from typing import Any

from app.core.config import ConfigError
from app.db.fallback_store import fallback_store
from app.db.supabase_client import get_supabase_service_client


class RecommendationsRepository:
    def __init__(self, client_provider: Any | None = None) -> None:
        self._client_provider = client_provider or get_supabase_service_client

    def get_by_cv_and_job(self, cv_id: str, job_id: str) -> dict[str, Any] | None:
        try:
            response = (
                self._client_provider()
                .table("cv_recommendations")
                .select("*")
                .eq("cv_id", cv_id)
                .eq("job_id", job_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            return response.data[0] if response.data else None
        except ConfigError:
            return next(
                (
                    row
                    for row in fallback_store.recommendations.values()
                    if row.get("cv_id") == cv_id and row.get("job_id") == job_id
                ),
                None,
            )
        except Exception as exc:
            raise RecommendationsRepositoryError(
                "Recommendation lookup failed."
            ) from exc

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            response = (
                self._client_provider()
                .table("cv_recommendations")
                .insert(payload)
                .execute()
            )
        except ConfigError:
            return fallback_store.put("recommendations", payload)
        except Exception as exc:
            raise RecommendationsRepositoryError(
                "Recommendation persistence failed."
            ) from exc
        if not response.data:
            raise RecommendationsRepositoryError(
                "Recommendation persistence returned no record."
            )
        return response.data[0]


class RecommendationsRepositoryError(RuntimeError):
    pass
