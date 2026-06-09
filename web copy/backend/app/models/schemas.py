from __future__ import annotations
from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Auth ────────────────────────────────────────────────────

class UserInfo(BaseModel):
    id: UUID
    email: str


# ── Profile ─────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    current_status: Optional[str] = None
    target_roles: Optional[list[str]] = None
    target_locations: Optional[list[str]] = None
    deal_breakers: Optional[list[str]] = None
    onboarding_completed: Optional[bool] = None


class EducationCreate(BaseModel):
    degree: Optional[str] = None
    field: Optional[str] = None
    institution: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    gpa: Optional[float] = None
    thesis: Optional[str] = None
    highlights: list[str] = []
    sort_order: int = 0


class ExperienceCreate(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    responsibilities: list[str] = []
    achievements: list[str] = []
    technologies: list[str] = []
    sort_order: int = 0


class SkillCreate(BaseModel):
    name: str
    category: str = "primary"
    level: Optional[str] = None
    years_experience: Optional[float] = None


# ── Jobs ─────────────────────────────────────────────────────

class JobSearchParams(BaseModel):
    query: str = ""
    location: Optional[str] = None
    source: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    experience_years: Optional[int] = None
    page: int = 1
    limit: int = 20


class JobPostingOut(BaseModel):
    id: UUID
    external_id: Optional[str]
    source: str
    title: str
    company: str
    company_logo_url: Optional[str]
    location: Optional[str]
    is_remote: bool
    description: Optional[str]
    requirements: list[str]
    benefits: list[str]
    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_currency: str
    salary_negotiable: bool
    employment_type: Optional[str]
    experience_years_min: Optional[int]
    experience_years_max: Optional[int]
    skills_required: list[str]
    posted_at: Optional[datetime]
    deadline: Optional[datetime]
    url: str
    is_active: bool
    scraped_at: datetime


# ── Fit evaluation ───────────────────────────────────────────

class FitDimension(BaseModel):
    score: int
    notes: str


class FitEvaluation(BaseModel):
    technical_skills: FitDimension
    experience_match: FitDimension
    cultural_fit: FitDimension
    career_alignment: FitDimension
    overall_score: int
    verdict: str
    strengths: list[str]
    gaps: list[str]
    recommendation: str


# ── CV ────────────────────────────────────────────────────────

class CVSection(BaseModel):
    id: str
    type: str
    title: str
    content: Any
    sort_order: int = 0


class CVCreate(BaseModel):
    title: str
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    profile_statement: Optional[str] = None
    sections: list[CVSection] = []
    is_master: bool = False


class CVUpdate(BaseModel):
    title: Optional[str] = None
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    profile_statement: Optional[str] = None
    sections: Optional[list[CVSection]] = None


class CVOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    target_role: Optional[str]
    target_company: Optional[str]
    profile_statement: Optional[str]
    sections: list[dict]
    html_content: Optional[str]
    pdf_url: Optional[str]
    is_master: bool
    version: int
    created_at: datetime
    updated_at: datetime


class CVSuggestion(BaseModel):
    id: UUID
    section: Optional[str]
    suggestion_type: str
    original_text: Optional[str]
    suggested_text: Optional[str]
    reason: Optional[str]
    is_applied: bool


class ApplySuggestionRequest(BaseModel):
    suggestion_ids: list[UUID]


# ── Applications ─────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    job_posting_id: Optional[UUID] = None
    company_name: Optional[str] = None
    role_title: Optional[str] = None
    source_url: Optional[str] = None
    status: str = "bookmarked"
    notes: Optional[str] = None
    salary_expected: Optional[int] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    salary_expected: Optional[int] = None
    applied_at: Optional[datetime] = None
    interview_at: Optional[datetime] = None
    cv_id: Optional[UUID] = None
    cover_letter_id: Optional[UUID] = None


class ApplicationOut(BaseModel):
    id: UUID
    user_id: UUID
    job_posting_id: Optional[UUID]
    cv_id: Optional[UUID]
    cover_letter_id: Optional[UUID]
    status: str
    fit_score: Optional[float]
    fit_evaluation: Optional[dict]
    salary_expected: Optional[int]
    applied_at: Optional[datetime]
    interview_at: Optional[datetime]
    notes: Optional[str]
    company_name: Optional[str]
    role_title: Optional[str]
    source_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    job_posting: Optional[dict] = None


# ── Chat ─────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    session_id: Optional[UUID] = None
    message: str
    context_type: str = "general"
    context_id: Optional[UUID] = None


class ChatSessionOut(BaseModel):
    id: UUID
    title: str
    context_type: str
    created_at: datetime


# ── Analytics ────────────────────────────────────────────────

class AnalyticsData(BaseModel):
    category: str
    data: dict
    date: date
    period: str


# ── Cover letter ─────────────────────────────────────────────

class CoverLetterCreate(BaseModel):
    job_posting_id: Optional[UUID] = None
    title: Optional[str] = None
    content: Optional[str] = None
    language: str = "vi"


class GenerateCoverLetterRequest(BaseModel):
    job_posting_id: UUID
    cv_id: Optional[UUID] = None
    language: str = "vi"
    tone: str = "professional"
