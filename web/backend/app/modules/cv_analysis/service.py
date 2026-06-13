from __future__ import annotations

import json
from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import ValidationError

from app.modules.ai.adapter import AIAdapterError, CvAnalysisAIAdapter
from app.modules.cv_analysis.repository import (
    CvAnalysisRepository,
    CvAnalysisRepositoryError,
)
from app.modules.cv_analysis.schemas import (
    CandidateProfileV1,
    CvAnalysisMeta,
    CvAnalysisRecord,
    CvAnalysisResponse,
    CvAnalysisSection,
)


SCHEMA_VERSION = "candidate_profile_v1"


class CvAnalysisError(ValueError):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class CvAnalysisService:
    def __init__(
        self,
        repository: CvAnalysisRepository,
        ai_adapter: CvAnalysisAIAdapter,
    ) -> None:
        self._repository = repository
        self._ai_adapter = ai_adapter

    def analyze(self, cv_id: UUID) -> CvAnalysisResponse:
        try:
            cv_document = self._repository.get_cv_document(str(cv_id))
        except CvAnalysisRepositoryError as exc:
            raise CvAnalysisError(
                "cv_lookup_failed",
                "The CV could not be loaded.",
                503,
            ) from exc

        if cv_document is None:
            raise CvAnalysisError("cv_not_found", "The CV was not found.", 404)

        cv_text = cv_document.get("extracted_text")
        if not isinstance(cv_text, str) or not cv_text.strip():
            raise CvAnalysisError(
                "cv_text_unavailable",
                "The CV has no extracted text to analyze.",
                422,
            )

        schema = CandidateProfileV1.model_json_schema()
        try:
            first_result = self._ai_adapter.generate_candidate_profile(
                cv_text=cv_text,
                schema=schema,
            )
        except AIAdapterError as exc:
            raise CvAnalysisError(
                "ai_provider_unavailable",
                "CV analysis is temporarily unavailable.",
                503,
            ) from exc

        try:
            profile = self._validate_profile(first_result.text)
            model_name = first_result.model_name
        except (json.JSONDecodeError, ValidationError) as first_error:
            try:
                repaired_result = self._ai_adapter.repair_candidate_profile(
                    cv_text=cv_text,
                    invalid_output=first_result.text,
                    validation_errors=self._safe_validation_errors(first_error),
                    schema=schema,
                )
                profile = self._validate_profile(repaired_result.text)
                model_name = repaired_result.model_name or first_result.model_name
            except AIAdapterError as exc:
                raise CvAnalysisError(
                    "ai_provider_unavailable",
                    "CV analysis is temporarily unavailable.",
                    503,
                ) from exc
            except (json.JSONDecodeError, ValidationError) as exc:
                raise CvAnalysisError(
                    "cv_analysis_invalid_output",
                    "CV analysis returned invalid structured data.",
                    502,
                ) from exc

        analysis_id = uuid4()
        created_at = datetime.now(UTC)
        payload = {
            "id": str(analysis_id),
            "cv_id": str(cv_id),
            "schema_version": SCHEMA_VERSION,
            "profile_json": profile.model_dump(mode="json"),
            "model_name": model_name,
            "validation_state": "validated",
            "created_at": created_at.isoformat(),
        }
        try:
            persisted = self._repository.create_analysis(payload)
        except CvAnalysisRepositoryError as exc:
            raise CvAnalysisError(
                "cv_analysis_persistence_failed",
                "The CV analysis could not be saved.",
                503,
            ) from exc

        return CvAnalysisResponse(
            data=CvAnalysisRecord(
                analysis_id=persisted.get("id", analysis_id),
                cv_id=persisted.get("cv_id", cv_id),
                schema_version=SCHEMA_VERSION,
                profile=profile,
                overall_score=self._overall_score(profile),
                top_priorities=self._top_priorities(profile),
                sections=self._sections(profile),
            ),
            meta=CvAnalysisMeta(),
        )

    @staticmethod
    def _overall_score(profile: CandidateProfileV1) -> int:
        skills = (
            profile.skills.technical
            + profile.skills.tools
            + profile.skills.soft
            + profile.skills.languages
        )
        return min(
            100,
            (20 if profile.summary.strip() else 0)
            + min(25, len(skills) * 5)
            + (15 if profile.education else 0)
            + (20 if profile.experience else 0)
            + (15 if profile.projects else 0)
            + (5 if profile.target_roles else 0),
        )

    @staticmethod
    def _top_priorities(profile: CandidateProfileV1) -> list[str]:
        priorities = list(profile.gaps)
        if not profile.experience:
            priorities.append("Add verified work, internship, or project experience.")
        if not profile.projects:
            priorities.append("Add verified projects that demonstrate relevant skills.")
        if not profile.target_roles:
            priorities.append("Clarify the target role using evidence already in the CV.")
        return list(dict.fromkeys(priorities))[:3]

    @classmethod
    def _sections(cls, profile: CandidateProfileV1) -> list[CvAnalysisSection]:
        skills = (
            profile.skills.technical
            + profile.skills.tools
            + profile.skills.soft
            + profile.skills.languages
        )
        section_values = [
            ("summary", "Professional summary", profile.summary, bool(profile.summary.strip())),
            ("skills", "Skills", ", ".join(skills), bool(skills)),
            ("experience", "Experience", f"{len(profile.experience)} verified item(s)", bool(profile.experience)),
            ("education", "Education", f"{len(profile.education)} verified item(s)", bool(profile.education)),
            ("projects", "Projects", f"{len(profile.projects)} verified item(s)", bool(profile.projects)),
        ]
        sections = []
        for section_id, title, preview, present in section_values:
            sections.append(
                CvAnalysisSection(
                    id=section_id,
                    title=title,
                    content_preview=preview[:240],
                    score=10 if present else 0,
                    issues=[] if present else [f"No verified {title.casefold()} content was found."],
                    suggestions=[] if present else [f"Add {title.casefold()} content only when it is true and verifiable."],
                )
            )
        return sections

    @staticmethod
    def _validate_profile(raw_output: str) -> CandidateProfileV1:
        payload = json.loads(raw_output)
        return CandidateProfileV1.model_validate(payload)

    @staticmethod
    def _safe_validation_errors(error: Exception) -> str:
        if isinstance(error, json.JSONDecodeError):
            return "Output must be one valid JSON object."
        return "Output does not match the required candidate profile schema."
