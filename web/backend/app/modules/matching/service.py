from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import ValidationError

from app.modules.cv_analysis.schemas import CandidateProfileV1
from app.modules.jobs.service import JobNotFoundError, JobsService
from app.modules.matching.repository import MatchingRepository, MatchingRepositoryError
from app.modules.matching.scorer import SCORING_VERSION, score_candidate
from app.modules.matching.schemas import (
    FrontendScoreBreakdown,
    FitScoreResult,
    FitScoresData,
    FitScoresResponse,
)


class MatchingError(ValueError):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class MatchingService:
    def __init__(
        self,
        repository: MatchingRepository | None = None,
        jobs_service: JobsService | None = None,
    ) -> None:
        self._repository = repository or MatchingRepository()
        self._jobs_service = jobs_service or JobsService()

    def calculate(self, analysis_id: UUID, job_ids: list[str]) -> FitScoresResponse:
        try:
            analysis = self._repository.get_analysis(str(analysis_id))
        except MatchingRepositoryError as exc:
            raise MatchingError(
                "analysis_lookup_failed",
                "The CV analysis could not be loaded.",
                503,
            ) from exc
        if analysis is None:
            raise MatchingError(
                "analysis_not_found",
                "The CV analysis was not found.",
                404,
            )
        try:
            profile = CandidateProfileV1.model_validate(analysis["profile_json"])
        except (KeyError, ValidationError) as exc:
            raise MatchingError(
                "analysis_profile_invalid",
                "The stored CV analysis is invalid.",
                422,
            ) from exc

        results = []
        payloads = []
        calculated_at = datetime.now(UTC).isoformat()
        for job_id in dict.fromkeys(job_ids):
            try:
                job = self._jobs_service.get_job(job_id).data
            except JobNotFoundError as exc:
                raise MatchingError(
                    "job_not_found",
                    f"Job '{job_id}' was not found.",
                    404,
                ) from exc
            score, breakdown, matched, missing, fingerprint = score_candidate(
                profile,
                job,
            )
            match_id = uuid4()
            payload = {
                "id": str(match_id),
                "analysis_id": str(analysis_id),
                "job_id": job_id,
                "score": score,
                "breakdown": breakdown.model_dump(),
                "matched_skills": matched,
                "missing_skills": missing,
                "scoring_version": SCORING_VERSION,
                "input_fingerprint": fingerprint,
                "calculated_at": calculated_at,
            }
            payloads.append(payload)
            results.append(
                FitScoreResult(
                    match_id=match_id,
                    analysis_id=analysis_id,
                    job_id=job_id,
                    score=score,
                    breakdown=breakdown,
                    matched_skills=matched,
                    missing_skills=missing,
                    scoring_version=SCORING_VERSION,
                    input_fingerprint=fingerprint,
                )
            )

        try:
            persisted = self._repository.create_matches(payloads)
        except MatchingRepositoryError as exc:
            raise MatchingError(
                "fit_score_persistence_failed",
                "The fit scores could not be saved.",
                503,
            ) from exc
        persisted_ids = {row["job_id"]: row.get("id") for row in persisted}
        stable_results = [
            result.model_copy(
                update={
                    "match_id": UUID(
                        str(persisted_ids.get(result.job_id, result.match_id))
                    )
                }
            )
            for result in results
        ]
        single = stable_results[0] if len(stable_results) == 1 else None
        compatibility_breakdown = (
            [
                FrontendScoreBreakdown(
                    label="skills",
                    score=single.breakdown.skills,
                    notes="Deterministic skill overlap contribution.",
                ),
                FrontendScoreBreakdown(
                    label="role alignment",
                    score=single.breakdown.role_alignment,
                    notes="Deterministic target-role alignment contribution.",
                ),
                FrontendScoreBreakdown(
                    label="readiness",
                    score=single.breakdown.readiness,
                    notes="Deterministic readiness contribution.",
                ),
            ]
            if single
            else []
        )
        return FitScoresResponse(
            data=FitScoresData(
                results=stable_results,
                score_total=single.score if single else None,
                job_id=single.job_id if single else None,
                score_breakdown=compatibility_breakdown,
                matched_skills=single.matched_skills if single else [],
                missing_skills=single.missing_skills if single else [],
                explanation=(
                    "Deterministic score based on validated CV analysis and normalized job requirements."
                    if single
                    else None
                ),
            ),
            meta={"persisted": True, "count": len(stable_results)},
        )

    def calculate_for_cv(self, cv_id: UUID, job_id: str) -> FitScoresResponse:
        try:
            analysis = self._repository.get_latest_analysis_for_cv(str(cv_id))
        except MatchingRepositoryError as exc:
            raise MatchingError(
                "analysis_lookup_failed",
                "The latest CV analysis could not be loaded.",
                503,
            ) from exc
        if analysis is None:
            raise MatchingError(
                "analysis_not_found",
                "Analyze this CV before requesting a fit score.",
                404,
            )
        return self.calculate(UUID(str(analysis["id"])), [job_id])
