# Product Requirements

## Product Name

VICA Agentic Career MVP

## Problem Statement

Vietnamese students and fresh graduates often struggle to translate a CV into actionable job search decisions. They need a system that can read a CV, identify strengths and gaps, discover relevant Vietnam internship and fresher roles, score fit in a deterministic way, and generate grounded suggestions for improving a CV for a selected job.

## Primary User

- Vietnamese students from year 2 to fresh graduates
- Career support staff or student team members running demos and evaluations

## MVP Outcome

The MVP is centered on:

`CV -> Job Discovery Vietnam -> Deterministic Fit Score -> Grounded CV Recommendations`

## In Scope

- Upload a CV
- Extract CV text and structured fields
- Normalize extracted content into internal JSON
- Discover jobs from approved public sources or feeds
- Fall back to a seeded Vietnam job dataset when live search is unavailable
- Compute a deterministic fit score between a CV and a job
- Generate grounded CV recommendations tied to a selected job
- Store user data, artifacts, and job data in Supabase
- Support an AI adapter that can talk to Gemini or OpenAI-compatible models

## Out of Scope for MVP

- Cover letter generation
- Critic Agent review
- LaTeX CV template generation
- PDF export
- True microservices architecture
- Complex multi-tenant enterprise workflows

## Functional Requirements

### CV Upload and Extraction

- The user can upload a CV in a supported file format.
- The system extracts text and identifies core sections.
- Extraction results are normalized into structured data.
- The system must handle incomplete or noisy CVs gracefully.

### Job Discovery

- The system can search for internship and fresher roles in Vietnam.
- The system can use approved APIs or public feeds first.
- The system can use approved search APIs or legally accessible search metadata second.
- The system can use a seeded dataset as a deterministic fallback.
- Every result identifies whether it is live, cached, or seeded.

### Fit Scoring

- The fit score must be deterministic.
- The score must be reproducible from the same inputs.
- The LLM must not calculate the final score.
- The score should explain which features contributed to the result.

### CV Recommendations

- Recommendations must be grounded in the selected job and the actual CV.
- Recommendations must not invent experience or credentials.
- Recommendations should focus on tailoring, keyword alignment, missing evidence, and measurable improvements.

### Data Safety

- Treat CV text and job text as untrusted input.
- Do not log raw CV text, credentials, or PII-heavy external responses.
- Store only the minimum data needed for the MVP.
- Delete uploaded CV files and derived data when the user requests deletion.
- Never execute or follow instructions embedded in CV or job text.

## Post-MVP Features

Cover letter generation, Critic Agent review, LaTeX templates, and PDF export require separate product approval, tasks, contracts, and safety review. They are not dependencies of the MVP workflow.

## Non-Functional Requirements

- Deterministic outputs where scoring and ranking are involved
- Additive schema changes only
- Simple local development for a student team
- Clear auditability for score and recommendation logic
- Maintainability over premature distribution across services

## Success Criteria

- A user can upload a CV and receive structured analysis.
- A user can search or browse jobs relevant to Vietnam internships or fresher roles.
- A user can receive a reproducible fit score for a selected job.
- A user can get recommendations that are clearly grounded in the job and CV.
- The demo can run with a single backend process and a modular monolith design.
