from __future__ import annotations

import hashlib
import json

from app.modules.cv_analysis.schemas import CandidateProfileV1
from app.modules.jobs.schemas import JobRecord
from app.modules.matching.schemas import ScoreBreakdown


SCORING_VERSION = "deterministic_fit_v1"


def score_candidate(
    profile: CandidateProfileV1,
    job: JobRecord,
) -> tuple[int, ScoreBreakdown, list[str], list[str], str]:
    candidate_skills = {
        skill.casefold(): skill
        for skill in (
            profile.skills.technical
            + profile.skills.tools
            + profile.skills.soft
            + profile.skills.languages
        )
    }
    required_skills = {skill.casefold(): skill for skill in job.skills}
    matched_keys = sorted(set(candidate_skills) & set(required_skills))
    missing_keys = sorted(set(required_skills) - set(candidate_skills))
    matched = [required_skills[key] for key in matched_keys]
    missing = [required_skills[key] for key in missing_keys]

    skill_points = (
        70
        if not required_skills
        else round(70 * len(matched_keys) / len(required_skills))
    )
    title = job.title.casefold()
    role_points = 20 if any(role.casefold() in title for role in profile.target_roles) else 0
    has_readiness_evidence = bool(
        profile.education or profile.experience or profile.projects
    )
    readiness_points = 10 if has_readiness_evidence else 0
    breakdown = ScoreBreakdown(
        skills=skill_points,
        role_alignment=role_points,
        readiness=readiness_points,
    )
    score = breakdown.skills + breakdown.role_alignment + breakdown.readiness
    fingerprint_payload = {
        "version": SCORING_VERSION,
        "profile": profile.model_dump(mode="json"),
        "job": job.model_dump(mode="json"),
    }
    fingerprint = hashlib.sha256(
        json.dumps(
            fingerprint_payload,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()
    return score, breakdown, matched, missing, fingerprint
