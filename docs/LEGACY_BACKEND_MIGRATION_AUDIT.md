# Legacy Backend Migration Audit

The backend under `web copy/backend` is a required functional reference. It is
not a replacement for the modular backend under `web/backend`.

This mapping was completed before further feature porting. Each strategy uses
one of the approved porting-rule labels.

| Old file/function | Old behavior | Can reuse? | Risk | New module | New endpoint | Port strategy |
| ----------------- | ------------ | ---------- | ---- | ---------- | ------------ | ------------- |
| `app/main.py` application setup | Registers all legacy routers under `/api/v1`, configures CORS, and exposes `/health`. | Concepts only | Imports settings, clients, and every feature into one application boundary. | `app/main.py`, `app/api/v1` | `GET /api/v1/health` | adapt heavily |
| `app/config.py:Settings` | Loads Supabase, JWT, Gemini, frontend, and environment settings from `.env` at import time. | Field ideas only | Required secrets and import-time settings make tests and optional providers brittle. | `app/core` | None | use schema idea only |
| `app/deps.py:get_current_user` | Decodes a Supabase HS256 JWT and returns user ID/email. | Ownership idea | Disables audience verification and couples auth directly to one JWT secret. | `app/core` | Dependency used by user-owned endpoints | adapt heavily |
| `app/db/supabase.py:get_client`, `get_service_client` | Lazily creates global anon and service-role Supabase clients. | Client intent only | Global mutable clients and broad service-role access weaken isolation and testability. | `app/db` | None | create adapter boundary |
| `app/models/schemas.py` profile schemas | Defines profile, education, experience, and skill request fields. | Yes, as field reference | Weak constraints, mutable list defaults, and create schemas reused for updates. | `app/modules/profiles` | `GET/PUT /api/v1/profiles/me` | use schema idea only |
| `app/models/schemas.py` job schemas | Defines search filters and the legacy `job_postings` public shape. | Yes, as normalization reference | Raw database shape leaks into the API and provenance/fallback fields are absent. | `app/modules/jobs` | `GET /api/v1/jobs`, `GET /api/v1/jobs/{job_id}` | use schema idea only |
| `app/models/schemas.py:FitEvaluation` | Models four AI-scored dimensions, an overall score, verdict, strengths, and gaps. | Labels only | Numeric scores are LLM-generated and not reproducible. | `app/modules/matching` | `POST /api/v1/fit-scores` | discard unsafe code |
| `app/models/schemas.py` CV schemas | Models profile-built CV sections, suggestions, and apply-suggestion requests. | Section concepts | This is a CV builder model, not the new uploaded-document and analysis contract. | `app/modules/cv`, `app/modules/recommendations` | `/api/v1/cvs*`, `POST /api/v1/recommendations` | use schema idea only |
| `app/models/schemas.py` application schemas | Models bookmarked/applied lifecycle, optional job snapshots, CV references, dates, and notes. | Yes, as domain reference | Status values are unconstrained and saved jobs are conflated with applications. | `app/modules/saved_jobs`, `app/modules/applications` | `/api/v1/saved-jobs*`, `/api/v1/applications*` | adapt heavily |
| `app/models/schemas.py` chat, analytics, cover-letter schemas | Defines minimal request and response fields for post-MVP features. | Field ideas only | Insufficient validation for AI context, content size, language, tone, and ownership. | `app/modules/chat`, `app/modules/analytics`, `app/modules/cover_letters` | `/api/v1/chat*`, `/api/v1/analytics*`, `POST /api/v1/cover-letters` | use schema idea only |
| `app/api/jobs.py:search_jobs` | Authenticated search across selected sources with query, location, page, and limit. | Product behavior | Route invokes live scrapers directly through a service and returns an ad hoc shape. | `app/modules/jobs` | `GET /api/v1/jobs` | adapt heavily |
| `app/api/jobs.py:get_saved_jobs` | Returns paginated active cached `job_postings`; it does not return user bookmarks. | No | Misnamed behavior can expose all cached jobs as if user-owned. | `app/modules/jobs` | `GET /api/v1/jobs` | discard unsafe code |
| `app/api/jobs.py:get_job` | Fetches one raw `job_postings` row by UUID. | Behavior only | Direct route-to-Supabase access and raw row response. | `app/modules/jobs` | `GET /api/v1/jobs/{job_id}` | adapt heavily |
| `app/api/jobs.py:evaluate_job_fit` | Loads a job and profile tables, asks Gemini for scores, and marks the job seen. | Input gathering ideas | LLM-generated numeric score, mixed side effects, direct database/provider access. | `app/modules/matching` | `POST /api/v1/fit-scores` | discard unsafe code |
| `app/api/jobs.py:mark_job_seen` | Upserts `(user_id, job_posting_id)` into `seen_jobs`. | Yes, as event concept | Direct service-role access and no explicit analytics event boundary. | `app/modules/analytics` | Future explicit job-view event endpoint | create adapter boundary |
| `app/services/job_scraper.py:search_jobs` | Instantiates four scrapers globally, runs them concurrently, ignores individual failures, and caps combined results. | Orchestration idea | Live network runs by default, empty source selection can divide by zero, failures are silent. | `app/modules/jobs` | `GET /api/v1/jobs` | create adapter boundary |
| `app/services/job_scraper.py:_upsert_jobs`, `_job_to_record` | Normalizes `ScrapedJob` fields and upserts jobs by URL with an existing-row fallback. | Yes, normalization concepts | Persists raw payloads, catches every exception, and couples source collection to Supabase. | `app/modules/jobs` | None; repository operation behind job service | reuse logic with refactor |
| `app/scrapers/base.py:ScrapedJob` | Defines a normalized source job record with salary, skills, dates, URL, and raw data. | Yes | Dataclass validation is weak and raw payload retention may expose unnecessary data. | `app/modules/jobs/scrapers` | None | reuse logic with refactor |
| `app/scrapers/base.py:BaseJobScraper` | Defines async `search` and `get_detail` methods for job sources. | Yes | Interface lacks health, provenance, rate-limit, and capability metadata. | `app/modules/jobs/scrapers` | None | create adapter boundary |
| `app/scrapers/vietnamworks.py` | Calls a VietnamWorks JSON endpoint and maps location, salary, experience, skills, benefits, and dates. | Parsers may help later | Undocumented live endpoint, stale IDs/contracts, encoding issues, and terms/rate-limit concerns. | `app/modules/jobs/scrapers` | Disabled source behind `GET /api/v1/jobs` | create adapter boundary |
| `app/scrapers/itviec.py` | Scrapes search/detail HTML and parses title, company, location, salary, and skills. | Parsers may help later | Brittle selectors, salary ambiguity, anti-bot/terms concerns, and swallowed parse errors. | `app/modules/jobs/scrapers` | Disabled source behind `GET /api/v1/jobs` | create adapter boundary |
| `app/scrapers/topcv.py` | Scrapes TopCV search/detail HTML and parses basic job fields and salary. | Parsers may help later | Brittle selectors, questionable request headers, stale URLs, and salary parsing ambiguity. | `app/modules/jobs/scrapers` | Disabled source behind `GET /api/v1/jobs` | create adapter boundary |
| `app/scrapers/careerviet.py` | Scrapes CareerViet search/detail HTML and parses basic job fields. | Parsers may help later | Location input is ignored, selectors are brittle, and live access is uncontrolled. | `app/modules/jobs/scrapers` | Disabled source behind `GET /api/v1/jobs` | create adapter boundary |
| `app/api/profile.py:get_profile` | Joins `profiles`, ordered `education`, ordered `experience`, and `skills` into one response. | Yes, aggregate behavior | Four direct service-role queries and raw table rows cross the route boundary. | `app/modules/profiles` | `GET /api/v1/profiles/me` | reuse logic with refactor |
| `app/api/profile.py:update_profile` | Partially updates non-null profile fields for the current user. | Yes | Cannot intentionally clear nullable fields and has no service/repository separation. | `app/modules/profiles` | `PUT /api/v1/profiles/me` | adapt heavily |
| `app/api/profile.py` education CRUD | Creates, replaces, or deletes user-owned education rows. | Yes, domain behavior | Update uses a create schema, permits weak values, and returns empty success on missing rows. | `app/modules/profiles` | Nested data in `PUT /api/v1/profiles/me` | adapt heavily |
| `app/api/profile.py` experience CRUD | Creates, replaces, or deletes user-owned experience rows and stringifies dates. | Yes, domain behavior | Update is not partial and validation/404 semantics are weak. | `app/modules/profiles` | Nested data in `PUT /api/v1/profiles/me` | adapt heavily |
| `app/api/profile.py` skill create/delete/replace | Creates one skill, deletes one skill, or delete-then-inserts the full list. | Yes, domain behavior | Full replacement is non-transactional and can lose all skills on insert failure. | `app/modules/profiles` | Nested data in `PUT /api/v1/profiles/me` | adapt heavily |
| `app/api/cv.py:list_cvs`, `get_cv`, `delete_cv` | Lists metadata, returns a full profile-built CV, and deletes an owned CV. | Ownership/list ideas | Legacy `cvs` rows represent generated CVs rather than uploaded documents. | `app/modules/cv` | `GET /api/v1/cvs/{cv_id}`, `DELETE /api/v1/cvs/{cv_id}` | adapt heavily |
| `app/api/cv.py:create_cv`, `update_cv` | Builds a CV from profile data and sections, renders HTML, and persists it. | Builder workflow only | Conflicts with upload-first MVP; route mixes four table reads, rendering, and persistence. | `app/modules/cv`, future CV builder | `POST /api/v1/cvs`; future builder endpoint only if approved | adapt heavily |
| `app/services/cv_service.py:build_cv_html`, section renderers | Renders ordered experience, education, skills, and custom sections into CV HTML. | Layout/domain ideas | Unescaped user content enables HTML injection; template and content logic are mixed. | `app/modules/exports` | `POST /api/v1/exports/pdf` | reuse logic with refactor |
| `app/api/cv.py:download_cv_pdf` | Loads owned HTML, renders it to PDF, and streams a named attachment. | Workflow idea | Stored untrusted HTML reaches a renderer and filename sanitization is incomplete. | `app/modules/exports` | `POST /api/v1/exports/pdf` | adapt heavily |
| `app/services/pdf_service.py:html_to_pdf` | Uses WeasyPrint and CSS selected by an HTML marker to generate A4 PDF bytes. | Rendering concept | Remote font fetch, untrusted HTML/CSS, SSRF/resource access, and heavy native dependency. | `app/modules/exports` | `POST /api/v1/exports/pdf` | create adapter boundary |
| `app/api/cv.py:analyze_cv` | Loads CV sections plus optional job context, requests suggestions, replaces old suggestions, and persists new ones. | Orchestration concept | Destructive replacement, no evidence contract, permissive AI output, direct DB/provider access. | `app/modules/recommendations` | `POST /api/v1/recommendations` | adapt heavily |
| `app/api/cv.py:get_cv_suggestions`, `apply_suggestions` | Lists unapplied suggestions and marks requested suggestions applied. | Lifecycle idea | Applying only flips a flag; it does not safely update a CV or verify `cv_id` ownership. | `app/modules/recommendations` | Future recommendation history/apply endpoints | adapt heavily |
| `app/services/gemini.py:analyze_cv_sections` | Prompts for up to eight weakness, keyword, reframe, add, or remove suggestions. | Yes, prompt goals | CV/job text is interpolated into instructions, JSON is not schema-validated, evidence is absent. | `app/modules/ai`, `app/modules/recommendations` | `POST /api/v1/recommendations` | use prompt idea only |
| `app/services/gemini.py:evaluate_fit` | Prompts Gemini for four dimension scores, overall score, verdict, strengths, gaps, and recommendation. | Non-numeric explanation themes only | Provider computes the final score; prompt injection and permissive JSON parsing are possible. | `app/modules/matching` | `POST /api/v1/fit-scores` | discard unsafe code |
| `app/api/applications.py:list_applications`, `get_application` | Lists/filter/paginates owned applications with joined job data and returns one detail record. | Yes, query behavior | Direct Supabase joins expose raw rows and pagination metadata is incomplete. | `app/modules/applications` | `GET /api/v1/applications` | reuse logic with refactor |
| `app/api/applications.py:create_application` | Creates an application and snapshots title/company/URL from a linked job when absent. | Yes | Status is unconstrained and lookup/create are not transactional. | `app/modules/applications` | `POST /api/v1/applications` | reuse logic with refactor |
| `app/api/applications.py:update_application`, `delete_application` | Partially updates lifecycle fields or deletes an owned application. | Update behavior only | Weak status/date validation and missing-row success ambiguity; delete is not in the current canonical endpoint set. | `app/modules/applications` | `PATCH /api/v1/applications/{application_id}` | adapt heavily |
| `app/api/applications.py:get_application_stats` | Counts applications by six statuses and calculates active count and offer rate. | Yes | `bookmarked` is mixed into applications and success-rate semantics are simplistic. | `app/modules/dashboard` | `GET /api/v1/dashboard/summary` | reuse logic with refactor |
| `app/api/applications.py` bookmarked application behavior | Uses application rows with status `bookmarked` as de facto saved jobs. | Domain clue only | Saved jobs and application tracking need separate ownership and lifecycle contracts. | `app/modules/saved_jobs` | `/api/v1/saved-jobs*` | adapt heavily |
| `app/api/analytics.py:get_user_activity` | Aggregates applications, seen jobs, CV count, status counts, and average stored fit score. | Yes, dashboard ideas | Sequential direct queries, legacy CV semantics, and truthy-only fit-score averaging. | `app/modules/dashboard` | `GET /api/v1/dashboard/summary` | reuse logic with refactor |
| `app/api/analytics.py:get_jobs_summary` | Counts active jobs and groups rows by source. | Yes | Grouping is done in application memory and relies on raw legacy fields. | `app/modules/analytics` | Future `GET /api/v1/analytics/jobs-summary` | reuse logic with refactor |
| `app/api/analytics.py:get_market_analytics` | Returns up to ten recent persisted market analytics rows, optionally by category. | Yes, read model idea | Raw AI-generated/stale records have no freshness or provenance contract. | `app/modules/analytics` | `GET /api/v1/analytics/market` | adapt heavily |
| `app/api/analytics.py:refresh_market_analytics` | Sends up to 200 active jobs to Gemini, then upserts weekly category records. | Aggregate categories only | LLM invents numeric counts, provider access is direct, and data provenance is unclear. | `app/modules/analytics`, `app/modules/ai` | Future controlled refresh endpoint | discard unsafe code |
| `app/services/gemini.py:generate_market_insights` | Prompts for top skills, sectors, salary ranges, employment types, locations, and prose insights. | Category/prompt idea | LLM-generated counts are not deterministic and output is not schema-validated. | `app/modules/analytics` | Future analytics endpoint | use prompt idea only |
| `app/api/chat.py:list_sessions`, `create_session`, `get_messages` | Provides owned session CRUD-lite and ordered message history. | Yes, data model behavior | Direct Supabase access, loose context types, and no retention/content limits. | `app/modules/chat` | `/api/v1/chat/sessions*` | adapt heavily |
| `app/api/chat.py:send_message` | Creates a session if needed, stores user text, loads history/profile/context, streams Gemini output, and stores it. | Workflow idea | PII sent to provider, ownership gap for supplied session IDs, incomplete-stream persistence, route/provider coupling. | `app/modules/chat`, `app/modules/ai` | `POST /api/v1/chat/messages` | adapt heavily |
| `app/services/gemini.py:chat_with_context` | Builds Vietnamese career-assistant context from profile/job/CV/interview data and streams model text. | Prompt role idea | Global model, untrusted text in instructions, weak context bounds, and no output safety contract. | `app/modules/ai` | Used by future chat service | use prompt idea only |
| `app/api/cv.py:generate_cover_letter` | Loads a job and profile aggregate, generates a letter, renders HTML, and persists both. | Workflow idea | Direct DB/provider access, broad PII context, and no validated grounding evidence. | `app/modules/cover_letters` | `POST /api/v1/cover-letters` | adapt heavily |
| `app/services/gemini.py:generate_cover_letter` | Requests a Vietnamese or English 300-400 word grounded letter in a chosen tone. | Yes, prompt goals | Free-text output is not evidence-checked; profile/job text is interpolated into instructions. | `app/modules/ai`, `app/modules/cover_letters` | `POST /api/v1/cover-letters` | use prompt idea only |
| `app/services/cv_service.py:build_cover_letter_html` | Wraps generated letter paragraphs and sender/job metadata in printable HTML. | Layout idea | Unescaped model/user content and mixed localization/template logic. | `app/modules/exports`, `app/modules/cover_letters` | `POST /api/v1/exports/pdf` | reuse logic with refactor |
| `app/services/gemini.py` module initialization and `_clean_json` | Configures Gemini and creates a model globally; strips Markdown fences before `json.loads`. | No | Import-time provider initialization and permissive, unvalidated JSON parsing violate new rules. | `app/modules/ai` | None | discard unsafe code |
| `requirements.txt` | Pins FastAPI, Supabase, Gemini, scraping, JWT, multipart, and WeasyPrint dependencies. | Package inventory only | Versions are old; scraping/rendering packages expand attack surface and native install burden. | `web/backend/pyproject.toml` | None | adapt heavily |
| `web copy/backend/.env.example` | File is not present in the copied legacy backend. | No | Secrets must never be inferred from the repository-level `.env` or copied into new config. | `app/core` | None | discard unsafe code |

## Legacy Table Assumptions

The old code assumes these Supabase tables or relations:

- `profiles`, `education`, `experience`, `skills`
- `cvs`, `cv_suggestions`, `cover_letters`
- `job_postings`, `seen_jobs`
- `applications`
- `chat_sessions`, `chat_messages`
- `market_analytics`

These names and row shapes are reference clues, not an approved new schema.
New migrations must be owned by the target module, preserve user ownership, and
keep raw Supabase rows behind repositories.

## Current Migration Boundary

- Implemented in the new backend: uploaded CV extraction/read/delete,
  schema-validated CV analysis with a deterministic evidence-only fallback,
  normalized jobs with seeded fallback, a disabled scraper interface,
  deterministic fit scoring, and persisted grounded recommendations.
- The active root frontend now uses those canonical P0 endpoints. The legacy
  `src/app` full-feature tree remains dormant reference code.
- Deferred P1 boundary: profiles, saved jobs, application records, dashboard,
  and supporting auth/ownership.
- Deferred P2 boundary: real chat, market analytics, cover letters, and PDF
  export behavior.
- Live scraping remains disabled by default through
  `ENABLE_LIVE_JOB_SCRAPING=false`.

## Non-Negotiable Port Rules

- Keep `router -> service -> repository -> Supabase client`.
- Keep AI access as `router -> service -> AI adapter`.
- Keep job collection as `router -> service -> job source adapter`.
- Never initialize Supabase or an AI provider globally at import time.
- Never expose raw provider output or raw Supabase rows as the API contract.
- Never let an LLM produce the numeric fit score.
- Never run live scrapers by default.
- Never copy secrets or values from any `.env` file.
