from __future__ import annotations

from dataclasses import dataclass
import json
import re
from typing import Any, Protocol


class AIAdapterError(RuntimeError):
    """Sanitized provider failure safe to translate into an API error."""


@dataclass(frozen=True, slots=True)
class AITextResult:
    text: str
    model_name: str | None = None


class CvAnalysisAIAdapter(Protocol):
    def generate_candidate_profile(
        self,
        *,
        cv_text: str,
        schema: dict[str, Any],
    ) -> AITextResult: ...

    def repair_candidate_profile(
        self,
        *,
        cv_text: str,
        invalid_output: str,
        validation_errors: str,
        schema: dict[str, Any],
    ) -> AITextResult: ...


class RecommendationAIAdapter(Protocol):
    def generate_recommendations(
        self,
        *,
        cv_text: str,
        job: dict[str, Any],
        schema: dict[str, Any],
    ) -> AITextResult: ...

    def repair_recommendations(
        self,
        *,
        cv_text: str,
        job: dict[str, Any],
        invalid_output: str,
        validation_errors: str,
        schema: dict[str, Any],
    ) -> AITextResult: ...


class DeterministicCvAnalysisAdapter:
    """Local fallback that extracts only evidence present in CV text."""

    SKILLS = (
        "Python",
        "Java",
        "JavaScript",
        "TypeScript",
        "React",
        "Next.js",
        "FastAPI",
        "Django",
        "SQL",
        "PostgreSQL",
        "Supabase",
        "Git",
        "Docker",
        "AWS",
        "Figma",
        "Excel",
        "Power BI",
        "Machine Learning",
    )

    def generate_candidate_profile(
        self,
        *,
        cv_text: str,
        schema: dict[str, Any],
    ) -> AITextResult:
        normalized = " ".join(cv_text.split())
        skills = [
            skill
            for skill in self.SKILLS
            if re.search(rf"\b{re.escape(skill)}\b", normalized, re.IGNORECASE)
        ]
        lower = normalized.casefold()
        target_roles = []
        for role in (
            "Backend Intern",
            "Frontend Intern",
            "Data Analyst Intern",
            "Software Engineer Intern",
        ):
            if all(
                token in lower
                for token in role.casefold().split()
                if token != "intern"
            ):
                target_roles.append(role)
        profile = {
            "summary": normalized[:280] or "No readable summary was extracted.",
            "target_roles": target_roles,
            "skills": {
                "technical": skills,
                "tools": [
                    skill
                    for skill in skills
                    if skill in {"Git", "Docker", "Figma", "Excel", "Power BI"}
                ],
                "soft": [],
                "languages": [
                    language
                    for language in ("Vietnamese", "English")
                    if language.casefold() in lower
                ],
            },
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
            "strengths": (
                [f"Explicit evidence of {skill}" for skill in skills[:4]]
                or ["Readable CV content was extracted successfully"]
            ),
            "gaps": [
                "Education and experience details require provider-assisted structured extraction."
            ],
        }
        return AITextResult(json.dumps(profile), "deterministic-fallback-v1")

    def repair_candidate_profile(
        self,
        *,
        cv_text: str,
        invalid_output: str,
        validation_errors: str,
        schema: dict[str, Any],
    ) -> AITextResult:
        raise AIAdapterError("Deterministic output does not require repair.")
