from __future__ import annotations

from datetime import UTC, datetime
import json
from uuid import UUID, uuid4

from pydantic import ValidationError

from app.modules.ai.adapter import AIAdapterError, RecommendationAIAdapter
from app.modules.cv.repository import CvRepository, CvRepositoryError
from app.modules.jobs.service import JobNotFoundError, JobsService
from app.modules.recommendations.repository import (
    RecommendationsRepository,
    RecommendationsRepositoryError,
)
from app.modules.recommendations.schemas import (
    RecommendationRecord,
    RecommendationGeneration,
    RecommendationResponse,
    RecommendationSuggestion,
)


class RecommendationError(ValueError):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class RecommendationService:
    def __init__(
        self,
        repository: RecommendationsRepository | None = None,
        cv_repository: CvRepository | None = None,
        jobs_service: JobsService | None = None,
        ai_adapter: RecommendationAIAdapter | None = None,
    ) -> None:
        self._repository = repository or RecommendationsRepository()
        self._cv_repository = cv_repository or CvRepository()
        self._jobs_service = jobs_service or JobsService()
        self._ai_adapter = ai_adapter

    def create(self, cv_id: UUID, job_id: str) -> RecommendationResponse:
        try:
            cv = self._cv_repository.get_by_id(str(cv_id), "")
        except CvRepositoryError as exc:
            raise RecommendationError("cv_lookup_failed", "The CV could not be loaded.", 503) from exc
        if cv is None:
            raise RecommendationError("cv_not_found", "The CV was not found.", 404)
        try:
            job = self._jobs_service.get_job(job_id).data
        except JobNotFoundError as exc:
            raise RecommendationError("job_not_found", "The job was not found.", 404) from exc

        cv_text = str(cv.get("extracted_text", "")).strip()
        if not cv_text:
            raise RecommendationError("cv_text_unavailable", "The CV has no extracted text.", 422)

        if self._ai_adapter is None:
            suggestions = self._build_suggestions(
                cv_text, job.title, job.skills, job.description
            )
            priority = (
                "high"
                if any(
                    "not found" in item.cv_evidence.casefold()
                    for item in suggestions
                )
                else "medium"
            )
            warnings = [
                "Suggestions must be verified by the candidate before editing the CV."
            ]
            generator = "grounded_deterministic_v1"
        else:
            generation, generator = self._generate_with_ai(
                cv_text, job.model_dump(mode="json")
            )
            suggestions = generation.suggestions
            priority = generation.priority
            warnings = generation.warnings
        recommendation_id = uuid4()
        payload = {
            "id": str(recommendation_id),
            "cv_id": str(cv_id),
            "job_id": job_id,
            "schema_version": "recommendation_v1",
            "priority": priority,
            "suggestions": [item.model_dump() for item in suggestions],
            "evidence_links": [f"cv:{cv_id}", f"job:{job_id}"],
            "warnings": warnings,
            "created_at": datetime.now(UTC).isoformat(),
        }
        try:
            persisted = self._repository.create(payload)
        except RecommendationsRepositoryError as exc:
            raise RecommendationError(
                "recommendation_persistence_failed",
                "The recommendations could not be saved.",
                503,
            ) from exc
        return RecommendationResponse(
            data=RecommendationRecord(
                recommendation_id=persisted.get("id", recommendation_id),
                cv_id=cv_id,
                job_id=job_id,
                suggestions=suggestions,
                priority=payload["priority"],
                evidence_links=payload["evidence_links"],
                warnings=payload["warnings"],
                schema_version="recommendation_v1",
            ),
            meta={"persisted": True, "generator": generator},
        )

    def _generate_with_ai(
        self,
        cv_text: str,
        job: dict,
    ) -> tuple[RecommendationGeneration, str]:
        schema = RecommendationGeneration.model_json_schema()
        try:
            first = self._ai_adapter.generate_recommendations(
                cv_text=cv_text,
                job=job,
                schema=schema,
            )
        except AIAdapterError as exc:
            raise RecommendationError(
                "ai_provider_unavailable",
                "CV recommendations are temporarily unavailable.",
                503,
            ) from exc
        try:
            generation = self._validate_generation(first.text, cv_text, job)
            return generation, first.model_name or "configured_provider"
        except (json.JSONDecodeError, ValidationError, ValueError):
            try:
                repaired = self._ai_adapter.repair_recommendations(
                    cv_text=cv_text,
                    job=job,
                    invalid_output=first.text,
                    validation_errors=(
                        "Output must match recommendation_v1 and every evidence "
                        "value must be an exact source excerpt."
                    ),
                    schema=schema,
                )
                generation = self._validate_generation(
                    repaired.text, cv_text, job
                )
                return generation, repaired.model_name or first.model_name or "configured_provider"
            except AIAdapterError as exc:
                raise RecommendationError(
                    "ai_provider_unavailable",
                    "CV recommendations are temporarily unavailable.",
                    503,
                ) from exc
            except (json.JSONDecodeError, ValidationError, ValueError) as exc:
                raise RecommendationError(
                    "recommendation_invalid_output",
                    "CV recommendations returned invalid structured data.",
                    502,
                ) from exc

    @staticmethod
    def _validate_generation(
        raw_output: str,
        cv_text: str,
        job: dict,
    ) -> RecommendationGeneration:
        generation = RecommendationGeneration.model_validate(json.loads(raw_output))
        job_corpus = " ".join(
            [
                str(job.get("title", "")),
                str(job.get("description", "")),
                " ".join(job.get("skills", [])),
            ]
        )
        for suggestion in generation.suggestions:
            if suggestion.cv_evidence not in cv_text:
                raise ValueError("CV evidence is not grounded.")
            if suggestion.job_evidence not in job_corpus:
                raise ValueError("Job evidence is not grounded.")
            if not suggestion.prohibited_claims:
                raise ValueError("Prohibited claims are required.")
        return generation

    @staticmethod
    def _build_suggestions(
        cv_text: str,
        job_title: str,
        job_skills: list[str],
        job_description: str,
    ) -> list[RecommendationSuggestion]:
        lower_cv = cv_text.casefold()
        matched = [skill for skill in job_skills if skill.casefold() in lower_cv]
        missing = [skill for skill in job_skills if skill.casefold() not in lower_cv]
        suggestions: list[RecommendationSuggestion] = []
        if matched:
            evidence = ", ".join(matched[:4])
            suggestions.append(
                RecommendationSuggestion(
                    target_section="Skills and project bullets",
                    action=f"Surface the existing evidence for {evidence} near the top of the CV.",
                    reason=f"These verified skills align directly with the {job_title} requirements.",
                    cv_evidence=f"The uploaded CV explicitly contains: {evidence}.",
                    job_evidence=f"The job lists these skills: {evidence}.",
                    prohibited_claims=["Do not add proficiency levels, years, or outcomes not stated in the CV."],
                )
            )
        for skill in missing[:3]:
            suggestions.append(
                RecommendationSuggestion(
                    target_section="Skills gap",
                    action=f"Do not claim {skill}. Add it only after gaining real evidence, or explain an adjacent verified skill.",
                    reason="The job requests this skill, but the uploaded CV does not support the claim.",
                    cv_evidence=f"No explicit evidence for {skill} was found in the uploaded CV.",
                    job_evidence=f"The selected job lists {skill} as a relevant skill.",
                    prohibited_claims=[f"Do not state experience with {skill} unless it is true and verifiable."],
                )
            )
        suggestions.append(
            RecommendationSuggestion(
                target_section="Professional summary",
                action=f"Tailor the summary toward {job_title} using only the strongest evidence already present.",
                reason="A role-specific summary helps reviewers connect verified evidence to the selected role.",
                cv_evidence=f"CV excerpt: {cv_text[:180]}",
                job_evidence=f"Selected role: {job_title}. Job excerpt: {job_description[:180]}",
                prohibited_claims=["Do not invent employers, metrics, certifications, or project outcomes."],
            )
        )
        return suggestions[:5]
