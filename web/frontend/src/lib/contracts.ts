import type { JobPosting } from "./types";

type UnknownRecord = Record<string, unknown>;

export interface FitScoreResult {
  score_total: number;
  score_breakdown?: Array<{ label: string; score: number; notes?: string }>;
  matched_skills?: string[];
  missing_skills?: string[];
  explanation?: string;
}

export interface RecommendationSuggestion {
  target_section?: string;
  action: string;
  reason?: string;
  cv_evidence?: string;
  job_evidence?: string;
  prohibited_claims?: string[];
}

export interface RecommendationResult {
  suggestions: RecommendationSuggestion[];
  priority?: string[];
  warnings?: string[];
}

export interface CVAnalysisPayload {
  name?: string;
  overall_score?: number;
  summary_message?: string;
  top_priorities?: string[];
  sections: Array<{
    id?: string;
    title?: string;
    content_preview?: string;
    score?: number;
    issues: string[];
    suggestions: string[];
  }>;
  suggestions?: RecommendationSuggestion[];
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid API response: ${field} must be a string array`);
  }
  return value;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function requiredString(record: UnknownRecord, field: string): string {
  const value = optionalString(record[field]);
  if (!value) throw new Error(`Invalid API response: missing ${field}`);
  return value;
}

export function normalizeJob(value: unknown): JobPosting {
  if (!isRecord(value)) throw new Error("Invalid API response: job must be an object");

  const skills = stringArray(value.skills ?? value.skills_required, "skills");
  const applyUrl = optionalString(value.apply_url ?? value.url);
  const availabilityStatus = optionalString(value.availability_status) || "available";
  const isSeeded = value.is_seeded === true;

  return {
    id: requiredString(value, "id"),
    external_id: optionalString(value.external_id),
    source: requiredString(value, "source"),
    title: requiredString(value, "title"),
    company: requiredString(value, "company"),
    company_logo_url: optionalString(value.company_logo_url),
    location: optionalString(value.location),
    is_remote: value.is_remote === true,
    description: optionalString(value.description),
    requirements: stringArray(value.requirements, "requirements"),
    benefits: stringArray(value.benefits, "benefits"),
    salary_min: optionalNumber(value.salary_min),
    salary_max: optionalNumber(value.salary_max),
    salary_currency: optionalString(value.salary_currency) || "VND",
    salary_negotiable: value.salary_negotiable === true,
    employment_type: optionalString(value.employment_type),
    experience_years_min: optionalNumber(value.experience_years_min),
    experience_years_max: optionalNumber(value.experience_years_max),
    skills_required: skills,
    posted_at: optionalString(value.posted_at),
    deadline: optionalString(value.deadline),
    url: applyUrl,
    is_active: value.is_active !== false,
    scraped_at: optionalString(value.scraped_at) || "",
    is_seeded: isSeeded,
    availability_status: availabilityStatus,
  };
}

export function normalizeJobList(value: unknown): JobPosting[] {
  const rawJobs = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.jobs)
      ? value.jobs
      : isRecord(value) && Array.isArray(value.items)
        ? value.items
        : null;
  if (!rawJobs) throw new Error("Invalid API response: expected a job list");
  return rawJobs.map(normalizeJob);
}

export function canApplyToJob(job: JobPosting): job is JobPosting & { url: string } {
  return Boolean(
    job.url &&
      !job.is_seeded &&
      !["sample", "disabled", "unavailable"].includes(job.availability_status)
  );
}

export function validateFitScore(value: unknown): FitScoreResult {
  if (!isRecord(value) || typeof value.score_total !== "number") {
    throw new Error("Invalid API response: malformed fit score");
  }
  const scoreBreakdown = value.score_breakdown;
  if (
    scoreBreakdown !== undefined &&
    (!Array.isArray(scoreBreakdown) ||
      scoreBreakdown.some(
        (item) =>
          !isRecord(item) ||
          typeof item.label !== "string" ||
          typeof item.score !== "number"
      ))
  ) {
    throw new Error("Invalid API response: malformed score breakdown");
  }
  return {
    score_total: value.score_total,
    score_breakdown: scoreBreakdown as FitScoreResult["score_breakdown"],
    matched_skills: stringArray(value.matched_skills, "matched_skills"),
    missing_skills: stringArray(value.missing_skills, "missing_skills"),
    explanation: optionalString(value.explanation),
  };
}

function normalizeSuggestion(value: unknown): RecommendationSuggestion {
  if (!isRecord(value)) throw new Error("Invalid API response: malformed recommendation");
  return {
    target_section: optionalString(value.target_section),
    action: requiredString(value, "action"),
    reason: optionalString(value.reason),
    cv_evidence: optionalString(value.cv_evidence),
    job_evidence: optionalString(value.job_evidence),
    prohibited_claims: stringArray(value.prohibited_claims, "prohibited_claims"),
  };
}

export function validateRecommendations(value: unknown): RecommendationResult {
  if (!isRecord(value) || !Array.isArray(value.suggestions)) {
    throw new Error("Invalid API response: malformed recommendations");
  }
  return {
    suggestions: value.suggestions.map(normalizeSuggestion),
    priority: stringArray(value.priority, "priority"),
    warnings: stringArray(value.warnings, "warnings"),
  };
}

export function validateCvAnalysis(value: unknown): CVAnalysisPayload {
  if (!isRecord(value)) throw new Error("Invalid API response: malformed CV analysis");
  const rawSections = value.sections ?? [];
  if (!Array.isArray(rawSections)) {
    throw new Error("Invalid API response: sections must be an array");
  }
  const sections = rawSections.map((section) => {
    if (!isRecord(section)) {
      throw new Error("Invalid API response: malformed CV analysis section");
    }
    return {
      id: optionalString(section.id),
      title: optionalString(section.title),
      content_preview: optionalString(section.content_preview),
      score: optionalNumber(section.score),
      issues: stringArray(section.issues, "issues"),
      suggestions: stringArray(section.suggestions, "suggestions"),
    };
  });
  const rawSuggestions = value.suggestions;
  return {
    name: optionalString(value.name),
    overall_score: optionalNumber(value.overall_score),
    summary_message: optionalString(value.summary_message),
    top_priorities: stringArray(value.top_priorities, "top_priorities"),
    sections,
    suggestions: Array.isArray(rawSuggestions)
      ? rawSuggestions.map(normalizeSuggestion)
      : undefined,
  };
}

export function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (!isRecord(payload)) return fallback;
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail;
  if (isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message || fallback;
  }
  return fallback;
}
