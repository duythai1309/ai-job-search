from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DEFAULT_SEED_PATH = (
    Path(__file__).resolve().parents[5] / "data" / "seed_jobs_vietnam.sample.json"
)


class SeedJobSource:
    def __init__(self, path: Path = DEFAULT_SEED_PATH) -> None:
        self._path = path

    def list_jobs(self) -> list[dict[str, Any]]:
        return json.loads(self._path.read_text(encoding="utf-8"))

    def get_by_id(self, job_id: str) -> dict[str, Any] | None:
        return next(
            (job for job in self.list_jobs() if str(job.get("id")) == job_id),
            None,
        )
