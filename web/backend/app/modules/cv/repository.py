from __future__ import annotations

from typing import Any

from app.core.config import ConfigError
from app.db.fallback_store import fallback_store
from app.db.supabase_client import get_supabase_service_client


class CvRepositoryError(RuntimeError):
    pass


class CvRepository:
    def __init__(self, client_provider: Any | None = None) -> None:
        self._client_provider = client_provider or get_supabase_service_client

    def list_for_user(self, user_id: str) -> list[dict[str, Any]]:
        raise NotImplementedError("CV repository persistence is not implemented yet.")

    def get_by_id(self, cv_id: str, user_id: str) -> dict[str, Any] | None:
        try:
            query = (
                self._client_provider()
                .table("cv_documents")
                .select("*")
                .eq("id", cv_id)
            )
            if user_id:
                query = query.eq("user_id", user_id)
            return query.maybe_single().execute().data
        except ConfigError:
            record = fallback_store.get("cv_documents", cv_id)
            if record is None or (user_id and record.get("user_id") != user_id):
                return None
            return record
        except Exception as exc:
            raise CvRepositoryError("CV document lookup failed.") from exc

    def create_document(self, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            response = (
                self._client_provider()
                .table("cv_documents")
                .insert(payload)
                .execute()
            )
        except ConfigError:
            return fallback_store.put("cv_documents", payload)
        except Exception as exc:
            raise CvRepositoryError("CV document persistence failed.") from exc

        if not response.data:
            raise CvRepositoryError("CV document persistence returned no record.")
        return response.data[0]

    def delete(self, cv_id: str, user_id: str) -> None:
        try:
            query = self._client_provider().table("cv_documents").delete().eq(
                "id", cv_id
            )
            if user_id:
                query = query.eq("user_id", user_id)
            query.execute()
        except ConfigError:
            fallback_store.delete("cv_documents", cv_id)
        except Exception as exc:
            raise CvRepositoryError("CV document deletion failed.") from exc
