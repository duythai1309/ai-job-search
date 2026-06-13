from __future__ import annotations

from threading import RLock
from typing import Any


class FallbackStore:
    """Process-local persistence for demos when Supabase is not configured."""

    def __init__(self) -> None:
        self._lock = RLock()
        self.cv_documents: dict[str, dict[str, Any]] = {}
        self.cv_analyses: dict[str, dict[str, Any]] = {}
        self.job_matches: dict[str, dict[str, Any]] = {}
        self.recommendations: dict[str, dict[str, Any]] = {}

    def put(self, collection: str, record: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            stored = dict(record)
            getattr(self, collection)[str(stored["id"])] = stored
            return dict(stored)

    def get(self, collection: str, record_id: str) -> dict[str, Any] | None:
        with self._lock:
            record = getattr(self, collection).get(str(record_id))
            return dict(record) if record is not None else None

    def delete(self, collection: str, record_id: str) -> bool:
        with self._lock:
            return getattr(self, collection).pop(str(record_id), None) is not None


fallback_store = FallbackStore()
