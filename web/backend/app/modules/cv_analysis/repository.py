from __future__ import annotations

from typing import Any

from app.core.config import ConfigError
from app.db.fallback_store import fallback_store
from app.db.supabase_client import get_supabase_service_client


class CvAnalysisRepositoryError(RuntimeError):
    pass


class CvAnalysisRepository:
    def __init__(self, client_provider: Any | None = None) -> None:
        self._client_provider = client_provider or get_supabase_service_client

    def get_cv_document(self, cv_id: str) -> dict[str, Any] | None:
        try:
            response = (
                self._client_provider()
                .table("cv_documents")
                .select("id,extracted_text")
                .eq("id", cv_id)
                .maybe_single()
                .execute()
            )
        except ConfigError:
            return fallback_store.get("cv_documents", cv_id)
        except Exception as exc:
            raise CvAnalysisRepositoryError("CV document lookup failed.") from exc
        return response.data

    def create_analysis(self, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            response = (
                self._client_provider()
                .table("cv_analyses")
                .insert(payload)
                .execute()
            )
        except ConfigError:
            return fallback_store.put("cv_analyses", payload)
        except Exception as exc:
            raise CvAnalysisRepositoryError("CV analysis persistence failed.") from exc

        if not response.data:
            raise CvAnalysisRepositoryError(
                "CV analysis persistence returned no record."
            )
        return response.data[0]
