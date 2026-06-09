import type {
  CvAnalysisPlaceholder,
  CvRecommendationPlaceholder,
  JobMatchPlaceholder,
  WorkflowStep,
} from "./types";

export const workflowSteps: WorkflowStep[] = [
  { href: "/cv-upload", label: "Upload CV", shortLabel: "Upload" },
  { href: "/cv-analysis", label: "CV Analysis", shortLabel: "Analysis" },
  { href: "/job-matches", label: "Job Matches", shortLabel: "Matches" },
  {
    href: "/cv-recommendations",
    label: "CV Recommendations",
    shortLabel: "Improve",
  },
];

export const cvAnalysisPlaceholder: CvAnalysisPlaceholder = {
  candidateName: "Nguyen Minh Anh",
  targetRole: "Frontend Developer Intern",
  fileName: "minh-anh-cv.pdf",
  profileSummary:
    "Second-year computer science student with project experience in React, TypeScript, and collaborative product development.",
  skills: ["React", "TypeScript", "JavaScript", "Git", "Figma", "REST APIs"],
  strengths: [
    "Projects show direct evidence of frontend implementation.",
    "Technical stack aligns with common internship requirements.",
    "Education and project chronology are easy to verify.",
  ],
  gaps: [
    "Project bullets rarely describe measurable outcomes.",
    "English proficiency is mentioned without supporting evidence.",
    "No deployment or automated testing experience is shown.",
  ],
  sections: [
    {
      title: "Education",
      status: "strong",
      detail: "Degree, university, dates, and relevant coursework were detected.",
    },
    {
      title: "Projects",
      status: "strong",
      detail: "Three projects include role, technologies, and contribution details.",
    },
    {
      title: "Experience",
      status: "review",
      detail: "Student club work is useful but needs clearer ownership and outcomes.",
    },
    {
      title: "Certifications",
      status: "missing",
      detail: "No certification section was detected. This is optional for the MVP.",
    },
  ],
};

export const jobMatchesPlaceholder: JobMatchPlaceholder[] = [
  {
    id: "vnm-seed-001",
    title: "Software Engineering Intern",
    company: "Example Tech Vietnam",
    location: "Ho Chi Minh City",
    employmentType: "Internship",
    source: "Seed dataset",
    availabilityStatus: "sample",
    fitScore: 82,
    matchedSkills: ["React", "TypeScript", "Git", "REST APIs"],
    missingSkills: ["Unit testing", "CI/CD"],
    scoreBreakdown: [
      { label: "Skills", score: 88, detail: "4 of 6 weighted skills matched." },
      { label: "Level", score: 95, detail: "Student profile matches internship level." },
      { label: "Evidence", score: 72, detail: "Relevant projects exist but outcomes are thin." },
      { label: "Location", score: 70, detail: "Location preference is not confirmed." },
    ],
  },
  {
    id: "vnm-seed-004",
    title: "Business Analyst Fresher",
    company: "Example Services Vietnam",
    location: "Ho Chi Minh City",
    employmentType: "Full-time",
    source: "Seed dataset",
    availabilityStatus: "sample",
    fitScore: 68,
    matchedSkills: ["Communication", "Documentation", "Figma"],
    missingSkills: ["SQL", "Requirements gathering"],
    scoreBreakdown: [
      { label: "Skills", score: 61, detail: "Transferable skills match; core BA tools are missing." },
      { label: "Level", score: 78, detail: "Role accepts fresh graduates." },
      { label: "Evidence", score: 64, detail: "Club leadership supports stakeholder work." },
      { label: "Location", score: 70, detail: "Location preference is not confirmed." },
    ],
  },
  {
    id: "vnm-seed-003",
    title: "UI/UX Design Intern",
    company: "Example Studio Vietnam",
    location: "Da Nang",
    employmentType: "Internship",
    source: "Seed dataset",
    availabilityStatus: "sample",
    fitScore: 59,
    matchedSkills: ["Figma", "Prototyping"],
    missingSkills: ["User research", "Design systems"],
    scoreBreakdown: [
      { label: "Skills", score: 55, detail: "Two supporting design skills matched." },
      { label: "Level", score: 95, detail: "Student profile matches internship level." },
      { label: "Evidence", score: 46, detail: "Portfolio evidence is not present in the CV." },
      { label: "Location", score: 40, detail: "Role is outside the placeholder preferred location." },
    ],
  },
];

export const cvRecommendationsPlaceholder: CvRecommendationPlaceholder[] = [
  {
    id: "rec-001",
    targetSection: "Projects",
    priority: "high",
    action:
      "Rewrite the task-management project bullet to name the React and TypeScript work you personally delivered.",
    reason:
      "The selected job weights frontend implementation evidence more heavily than a generic team-project description.",
    cvEvidence:
      "Current CV: Built a task management website with a team of four students.",
    jobEvidence:
      "Selected job: Build and maintain React features using TypeScript and REST APIs.",
    prohibitedClaims: [
      "Do not add user counts, conversion impact, or production deployment unless verified.",
    ],
  },
  {
    id: "rec-002",
    targetSection: "Skills",
    priority: "high",
    action:
      "Group React, TypeScript, JavaScript, and REST APIs under a clear Frontend heading.",
    reason:
      "The relevant skills exist in the CV but are currently scattered and difficult to scan.",
    cvEvidence:
      "Current CV lists these tools across project descriptions and a general skills line.",
    jobEvidence:
      "Selected job explicitly requires React, TypeScript, Git, and API integration.",
    prohibitedClaims: ["Do not add testing or CI/CD skills that are not supported by the CV."],
  },
  {
    id: "rec-003",
    targetSection: "Experience",
    priority: "medium",
    action:
      "Clarify your ownership in the student club website work using a factual action-result structure.",
    reason:
      "The experience is relevant, but the current wording does not distinguish your contribution from the team's.",
    cvEvidence:
      "Current CV: Helped the technology club update its website.",
    jobEvidence:
      "Selected job values collaboration plus clear ownership of delivered frontend work.",
    prohibitedClaims: ["Do not change volunteer work into paid employment."],
  },
];
