export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  location?: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  current_status: "employed" | "unemployed" | "freelance" | "student";
  target_roles: string[];
  target_locations: string[];
  deal_breakers: string[];
  onboarding_completed: boolean;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
}

export interface Education {
  id: string;
  degree?: string;
  field?: string;
  institution?: string;
  start_year?: number;
  end_year?: number;
  gpa?: number;
  thesis?: string;
  highlights: string[];
}

export interface Experience {
  id: string;
  job_title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: "primary" | "secondary" | "domain" | "tool";
  level?: string;
  years_experience?: number;
}

export interface JobPosting {
  id: string;
  external_id?: string;
  source: "vietnamworks" | "topcv" | "itviec" | "careerviet" | "jobsgo" | "other";
  title: string;
  company: string;
  company_logo_url?: string;
  location?: string;
  is_remote: boolean;
  description?: string;
  requirements: string[];
  benefits: string[];
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  salary_negotiable: boolean;
  employment_type?: string;
  experience_years_min?: number;
  experience_years_max?: number;
  skills_required: string[];
  posted_at?: string;
  deadline?: string;
  url: string;
  is_active: boolean;
  scraped_at: string;
}

export interface FitEvaluation {
  technical_skills: { score: number; notes: string };
  experience_match: { score: number; notes: string };
  cultural_fit: { score: number; notes: string };
  career_alignment: { score: number; notes: string };
  overall_score: number;
  verdict: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export interface CV {
  id: string;
  user_id: string;
  title: string;
  target_role?: string;
  target_company?: string;
  profile_statement?: string;
  sections: CVSection[];
  html_content?: string;
  pdf_url?: string;
  is_master: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CVSection {
  id: string;
  type: "experience" | "education" | "skills" | "custom";
  title: string;
  content: unknown;
  sort_order: number;
}

export interface CVSuggestion {
  id: string;
  section?: string;
  suggestion_type: "weakness" | "keyword" | "reframe" | "add" | "remove";
  original_text?: string;
  suggested_text?: string;
  reason?: string;
  is_applied: boolean;
}

export interface Application {
  id: string;
  user_id: string;
  job_posting_id?: string;
  cv_id?: string;
  cover_letter_id?: string;
  status: "bookmarked" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";
  fit_score?: number;
  fit_evaluation?: FitEvaluation;
  salary_expected?: number;
  applied_at?: string;
  interview_at?: string;
  notes?: string;
  company_name?: string;
  role_title?: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
  job_postings?: JobPosting;
}

export interface ChatSession {
  id: string;
  title: string;
  context_type: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ApplicationStats {
  total: number;
  by_status: Record<string, number>;
  active: number;
  success_rate: number;
}

export const SOURCE_LABELS: Record<string, string> = {
  vietnamworks: "VietnamWorks",
  topcv: "TopCV",
  itviec: "ITviec",
  careerviet: "CareerViet",
  jobsgo: "JobsGo",
  other: "Khác",
};

export const STATUS_LABELS: Record<string, string> = {
  bookmarked: "Đã lưu",
  applied: "Đã ứng tuyển",
  interview: "Phỏng vấn",
  offer: "Nhận offer",
  rejected: "Bị từ chối",
  withdrawn: "Đã rút",
};

export const STATUS_COLORS: Record<string, string> = {
  bookmarked: "bg-slate-100 text-slate-700",
  applied: "bg-blue-100 text-blue-700",
  interview: "bg-orange-100 text-orange-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-500",
};

export function formatSalary(min?: number, max?: number, currency = "VND", negotiable = false): string {
  if (negotiable) return "Thỏa thuận";
  if (!min && !max) return "—";
  const fmt = (n: number) =>
    currency === "VND"
      ? `${(n / 1_000_000).toFixed(0)}tr`
      : `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}
