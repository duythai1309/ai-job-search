export type WorkflowStatus = "complete" | "current" | "upcoming";

export interface WorkflowStep {
  href: string;
  label: string;
  shortLabel: string;
}

export interface CvSectionSummary {
  title: string;
  status: "strong" | "review" | "missing";
  detail: string;
}

export interface CvAnalysisPlaceholder {
  candidateName: string;
  targetRole: string;
  fileName: string;
  profileSummary: string;
  skills: string[];
  strengths: string[];
  gaps: string[];
  sections: CvSectionSummary[];
}

export interface ScoreDimension {
  label: string;
  score: number;
  detail: string;
}

export interface JobMatchPlaceholder {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  source: string;
  availabilityStatus: "sample";
  fitScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  scoreBreakdown: ScoreDimension[];
}

export interface CvRecommendationPlaceholder {
  id: string;
  targetSection: string;
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
  cvEvidence: string;
  jobEvidence: string;
  prohibitedClaims: string[];
}
