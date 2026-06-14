# PROJECT_MEMORY.md

## Purpose

This file is a handoff memory for AI coding agents such as Codex, Gemini CLI, Claude Code, Cursor, Copilot, or other tools.

Read this file before making changes when:

- the previous agent ran out of context or tokens,
- a new AI tool is used,
- the project direction seems unclear,
- implementation continues from a previous session.

This file does not replace `AGENTS.md`, ADRs, task specs, or source code. It summarizes the current project state.

---

## Project Name

VICA — Agentic Career Matching Platform

---

## Product Direction

VICA is an Agentic Career MVP for Vietnamese students from year 2 to fresh graduates.

The core MVP flow is:

1. User uploads a CV.
2. Backend extracts CV text.
3. AI analyzes the CV into structured JSON.
4. User selects target role and location.
5. System discovers Vietnam internship/fresher jobs.
6. System normalizes job data.
7. Backend calculates deterministic fit scores.
8. User reviews matched jobs and score explanations.
9. System suggests grounded CV improvements for a selected job.

The MVP is not primarily a LaTeX CV generator. Cover letter generation, Critic Agent review, LaTeX templates, and PDF export are post-MVP or advanced features unless explicitly prioritized later.

---

## Active Frontend

The teammate frontend is the visual source of truth.

- Active and only compiled root: `web/frontend/src/app`
- Preserve teammate UI/UX when changing API wiring or architecture.
- Do not replace teammate pages with generic MVP placeholders.
- The duplicate `web/frontend/app` root and inactive `_legacy_app` copy are removed.
- Inactive AI-generated root-level `components` and `lib` placeholder modules are removed.
- Applications and profile use local browser storage until matching backend resources are added.
- CV upload, analysis, job discovery, fit scoring, and recommendations use the versioned MVP API contract.
- Plus Jakarta Sans and DM Sans are bundled locally to preserve teammate typography during offline builds.

---

## Current Architecture Decision

Use a modular monolith for the MVP, not true microservices.

Reason:

- The team needs a maintainable student-demo system.
- True microservices would add deployment, authentication, networking, observability, data consistency, and local development complexity.
- A single FastAPI backend process is acceptable for MVP.
- The backend should still be organized by clear domain boundaries so services can be extracted later if needed.

Target stack:

- Frontend: Next.js, React, TypeScript, TailwindCSS
- Backend: FastAPI
- Database/Auth/Storage: Supabase
- AI provider: provider-neutral adapter, initially Gemini/OpenAI-compatible
- Job data: approved API/public feed first, search metadata second, seeded Vietnam jobs dataset last

---

## Protected Starter Files

This repo is based on the AI20K Build Cohort 2 starter template.

Do not delete or overwrite:

- `scripts/`
- `.agents/`
- `.claude/`
- `.codex/`
- `.cursor/`
- `.gemini/`
- `.github/hooks/`
- `.env.example`
- `JOURNAL.md`
- `WORKLOG.md`

These files support course-required AI usage logging.

---

## Project Control Layer

The project should use:

- `AGENTS.md` for global AI agent rules.
- `docs/PRODUCT_REQUIREMENTS.md` for product scope.
- `docs/ARCHITECTURE.md` for architecture.
- `docs/API_CONTRACT.md` for stable API contracts.
- `docs/AGENT_FLOW.md` for AI workflow.
- `docs/DATA_STRATEGY.md` for job data and fallback strategy.
- `docs/CODING_RULES.md` for implementation constraints.
- `docs/adr/` for architecture decision records.
- `agents/*.md` for role-specific agent boundaries.
- `tasks/*.md` for small implementation tasks.
- `data/seed_jobs_vietnam.sample.json` for deterministic demo fallback.

---

## ADRs To Maintain

The expected ADR set is:

1. `0001-use-modular-monolith-for-mvp.md`
2. `0002-use-supabase-for-auth-data-and-storage.md`
3. `0003-use-deterministic-fit-scoring.md`
4. `0004-bound-llm-usage-to-validated-json.md`
5. `0005-use-tiered-job-data-fallback.md`
6. `0006-migrate-contracts-additively.md`

If architecture changes, create or update ADRs before major implementation work.

---

## Core Engineering Rules

1. Do not implement the full app in one step.
2. Read `AGENTS.md` before coding.
3. Read the relevant task file before coding.
4. Implement one task at a time.
5. Do not modify unrelated files.
6. Do not delete course logging infrastructure.
7. Do not hardcode API keys or secrets.
8. Do not bypass anti-bot or website access controls.
9. Use additive changes and avoid destructive migrations.
10. Update documentation when behavior changes.

---

## AI Rules

1. LLM output must be structured JSON.
2. LLM output must be validated with schema/Pydantic.
3. Allow at most one bounded repair attempt for invalid AI JSON.
4. Treat CV text and job descriptions as untrusted input, not instructions.
5. Do not log raw CV text, credentials, secrets, or full external responses containing personal data.
6. Do not fabricate candidate experience, skills, metrics, company claims, or job facts.
7. AI may extract evidence and generate explanations.
8. AI must not calculate final numeric fit score.

---

## Fit Score Rule

Final fit score must be deterministic and reproducible.

Recommended components:

- Required skills
- Preferred skills
- Role match
- Experience level
- Location/work mode
- Education/credential match

The LLM may extract candidate facts and job requirements, but application code computes the score.

---

## Job Data Strategy

Job discovery must use fallback levels:

1. Approved job APIs or public feeds.
2. Approved Google/search metadata if available.
3. Seeded Vietnam jobs dataset as deterministic fallback.

Never bypass access controls or anti-bot systems.

The app must still demo successfully when live job sources fail.

---

## Current MVP Task Sequence

Recommended implementation order:

1. Project initialization and skeleton.
2. CV upload and extraction.
3. CV analysis to structured JSON.
4. Vietnam job discovery with seeded fallback.
5. Deterministic fit score.
6. Grounded CV recommendations.
7. Demo stabilization.

Do not start with cover letter, Critic Agent, LaTeX, or PDF export unless the MVP flow is stable.

## Implementation Status

- Safe Supabase job ingestion now reuses `job_postings` through `JobsRepository`.
- Migration `0006_add_job_ingestion_fields.sql` adds only `source_job_id`, `raw_payload`, and dedupe indexes.
- Seed ingestion is enabled; TopCV, ITViec, VietnamWorks, CareerViet, and LinkedIn adapters contain no live network implementation and remain disabled by default.
- Ingestion accepts only Data/AI/IT/software and related intern/fresher roles, with deterministic dedupe.

- The backend modular shell has been established under `web/backend`.
- The `/api/v1/health` route is now wrapped through `app/modules/health/router.py`.
- The health response shape remains unchanged for compatibility.
- Supabase configuration and lazy client wrappers now live under `web/backend/app/core/config.py` and `web/backend/app/db/supabase_client.py`.
- Required Supabase environment variables are validated without printing secret values.
- Repository skeletons now exist for CV, jobs, recommendations, and audit domains under `web/backend/app/modules/*/repository.py`.
- Repository modules import safely without requiring live Supabase env or network access.
- Repository constructors accept optional client providers and remain stub-only until service wiring begins.
- `POST /api/v1/cvs` validates and extracts text from PDF and DOCX uploads without AI.
- Extracted CV records are persisted to Supabase `cv_documents` through the CV repository and return a stable `cv_id`.
- `POST /api/v1/cv-analyses` loads persisted CV text, validates AI JSON as `candidate_profile_v1`, allows one bounded repair attempt, and persists valid profiles to `cv_analyses`.
- CV analysis and recommendations use provider-neutral adapter protocols.
- `AI_PROVIDER=gemini` selects the concrete timeout-bounded Gemini REST adapter;
  `GEMINI_API_KEY` and `GEMINI_MODEL` are then required.
- With `AI_PROVIDER` unset, the existing deterministic evidence-only fallbacks
  remain active.
- Provider errors are sanitized, structured output receives at most one repair
  attempt, and no live model is called in tests.
- `GET /api/v1/jobs` and `GET /api/v1/jobs/{job_id}` use Supabase records first and the deterministic Vietnam seed dataset when no records are available.
- Live job scraping is behind an adapter boundary and disabled by default. No source-specific scraper has been ported.
- `POST /api/v1/fit-scores` computes versioned deterministic scores from validated analyses and normalized jobs, then persists `job_matches`.
- Grounded deterministic recommendations are implemented and persisted through
  `POST /api/v1/recommendations`.
- CV retrieval and deletion are implemented through the CV service/repository.
- Supabase-backed repositories use a process-local demo fallback only when
  Supabase configuration is unavailable.
- The active root frontend is wired end to end for upload, analysis, jobs,
  deterministic scoring, and recommendations.
- Chat, analytics, cover-letter, and PDF/export routes remain compatibility
  implementations for the dormant `src/app` tree; they are not active root
  frontend endpoints.
- P1 profile/saved-job/application/dashboard APIs remain inactive and pending.
- CV uploads are limited to 5 MiB. Supabase Storage and auth ownership are not implemented yet.

---

## Next Recommended Action

If the repo is still only the starter template:

1. Inspect starter files.
2. Create project control layer.
3. Review consistency.
4. Update `WORKLOG.md` and `JOURNAL.md`.
5. Commit documentation first.
6. Only then create the Next.js/FastAPI skeleton.

When implementing any pending or stubbed endpoint, first inspect its equivalent
under `web copy/backend`, update the legacy migration audit, and port useful
behavior through the new module boundaries. Canonical supporting routes use
`GET/PUT /api/v1/profiles/me` and `/api/v1/applications`; legacy route names and
direct route-to-Supabase/provider code are not carried forward.

---

## What Not To Do

Do not:

- claim the MVP is true microservices,
- rewrite the app from scratch without task approval,
- let LLM assign final fit scores,
- implement autonomous multi-agent workflows too early,
- prioritize LaTeX/PDF/export before the CV-to-job matching MVP,
- delete logging hooks,
- commit secrets,
- scrape job sites aggressively,
- store raw CV text in logs.

---

## Frontend Correctness Milestone

- Active frontend root remains `web/frontend/src/app`.
- The teammate frontend remains the visual source of truth.
- Backend job payloads are normalized from `skills`/`apply_url` into the teammate view model.
- Sample or unavailable jobs do not expose broken application links.
- Browser-only profile, application, saved-job, and CV state is scoped by authenticated user ID, with `demo-user` fallback.
- CV editing and suggestion application are explicitly local preview behavior because the MVP has no CV update endpoint.
- Chat is visibly unavailable and disabled because the current MVP API contract has no chat endpoint.
- Analytics describes the currently available job records and labels seeded data instead of claiming realtime sector or salary analysis.
- Important API responses now use lightweight runtime validators and safe error-envelope extraction.

## Backend Integration Milestone

- The modular backend prerequisite commits and the backend commits originally identified as `76180c5` and `715f2a5` are integrated into the hardened `frontend` branch.
- Safe job ingestion uses source adapters, deterministic normalization/filtering/deduplication, and repository upsert. Live adapters remain disabled by default.
- Backend contracts now match the teammate client for job query aliases, CV analysis presentation fields, single-job fit scoring, recommendation priority tags, and nested errors.
- The teammate UI/UX remains the visual source of truth; no active frontend files were changed during backend integration.
- Migration `0006_add_job_ingestion_fields.sql` must be applied to Supabase before live ingestion/upsert.
- CV authentication and ownership enforcement are not implemented yet.
