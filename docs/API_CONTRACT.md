# API Contract

## Contract Principles

- Use a `/api/v1` prefix for MVP endpoints
- Use versioned, additive API evolution
- Return structured JSON
- Validate request and response payloads
- Never trust raw CV or job text
- Keep score calculation separate from LLM output
- Use opaque IDs in logs and error reports

## Core Resources

### CV

Represents an uploaded resume or CV and its extracted content.

Example fields:

- `id`
- `user_id`
- `filename`
- `file_type`
- `storage_path`
- `extracted_text` (private persisted data; never returned in list responses or logs)
- `sections`
- `summary`
- `parser_version`
- `created_at`

### Job

Represents a Vietnam internship or fresher role from a live source or fallback dataset.

Example fields:

- `id`
- `source`
- `source_tier`
- `title`
- `company`
- `location`
- `employment_type`
- `level`
- `skills`
- `description`
- `apply_url`
- `posted_at`
- `is_seeded`
- `availability_status`

### Fit Result

Represents the deterministic comparison of one CV and one job.

Example fields:

- `cv_id`
- `job_id`
- `score_total`
- `score_breakdown`
- `matched_skills`
- `missing_skills`
- `evidence`
- `explanation`
- `scoring_version`
- `input_fingerprint`
- `calculated_at`

### Recommendation Result

Represents grounded recommendations for improving a CV for a specific job.

Example fields:

- `cv_id`
- `job_id`
- `suggestions`
- `priority`
- `evidence_links`
- `warnings`
- `schema_version`

Each suggestion must contain:

- `target_section`
- `action`
- `reason`
- `cv_evidence`
- `job_evidence`
- `prohibited_claims`

## Validation Rules

- Requests must be schema-validated on entry
- LLM output must be schema-validated before use
- Unknown fields should be ignored or rejected according to endpoint policy
- Invalid payloads should fail closed
- Untrusted CV and job text must be passed as data fields, never concatenated into system or developer instructions
- Recommendation suggestions without CV and job evidence must be rejected
- Scores must be calculated from normalized records, not raw LLM prose

## AI Provider Modes

- With `AI_PROVIDER` unset, CV analysis and recommendations use their existing
  deterministic, evidence-only fallbacks.
- With `AI_PROVIDER=gemini`, both endpoints call Gemini through the
  provider-neutral AI adapter.
- `GEMINI_API_KEY` and `GEMINI_MODEL` are required in Gemini mode.
- `AI_TIMEOUT_SECONDS` controls the provider request timeout and defaults to 20.
- Invalid provider configuration or provider transport failure returns a
  sanitized `503 ai_provider_unavailable`.
- Malformed structured output receives one repair attempt. A second invalid
  result returns a typed `502` and is never persisted.
- Fit scoring never calls an AI provider.

## MVP Endpoints

- `POST /api/v1/cvs`: upload and synchronously extract one supported CV file; returns `201` with the normalized CV record
- `POST /api/v1/cv-analyses`: accepts `cv_id`; returns a persisted, schema-validated `candidate_profile_v1`; uses Gemini when configured and deterministic extraction otherwise
- `GET /api/v1/cvs/{cv_id}`: returns the authenticated user's normalized CV record
- `DELETE /api/v1/cvs/{cv_id}`: deletes the user's stored file and derived CV records
- `GET /api/v1/jobs`: accepts `q`, `location`, `role_type`, and `limit`; returns normalized jobs plus source and fallback metadata
- `GET /api/v1/jobs/{job_id}`: returns one normalized job
- `POST /api/v1/fit-scores`: accepts `analysis_id` and one or more `job_ids`; returns persisted deterministic results
- `POST /api/v1/recommendations`: accepts `cv_id` and `job_id`; returns a validated `RecommendationResult`; provider evidence must be exact source excerpts

## Supporting Endpoints

- `GET /api/v1/profiles/me`: returns the authenticated user's validated profile aggregate
- `PUT /api/v1/profiles/me`: replaces the authenticated user's validated profile aggregate through the profile service and repository
- `GET /api/v1/saved-jobs`: returns the authenticated user's saved jobs
- `POST /api/v1/saved-jobs`: saves one job for the authenticated user
- `DELETE /api/v1/saved-jobs/{job_id}`: removes one saved job
- `GET /api/v1/applications`: lists the authenticated user's application records
- `POST /api/v1/applications`: creates an application record
- `PATCH /api/v1/applications/{application_id}`: updates an owned application record
- `GET /api/v1/dashboard/summary`: computes user dashboard aggregates from persisted records
- `GET /api/v1/analytics/market`: computes market aggregates from normalized jobs and matches without an LLM
- `GET /api/v1/chat/sessions`: lists owned chat sessions
- `POST /api/v1/chat/sessions`: creates an owned chat session
- `POST /api/v1/chat/messages`: persists a message and obtains any AI response through the AI adapter
- `POST /api/v1/cover-letters`: generates, validates, and persists a grounded cover letter
- `POST /api/v1/exports/pdf`: exports safe rendered content; a real HTML/text fallback is allowed when a PDF renderer cannot be safely supported

These supporting endpoints remain pending or stubbed until their module,
repository, ownership rules, migrations, and tests are implemented.

Post-MVP compatibility stubs currently exist for chat sessions/messages, market
analytics, cover letters, and PDF export. They return `implemented: false` and
must not be interpreted as completed feature behavior.

All user-owned CV endpoints require authentication. Job browse may be public for the demo, while scoring and recommendations require access to the referenced CV.

## Legacy Reference Requirement

Every stub-to-real endpoint conversion must begin by locating its functional
baseline under `web copy/backend`. Useful behavior may be ported, but route
handlers, direct Supabase access, global provider initialization, permissive AI
JSON parsing, LLM numeric scoring, and default-live scraping must not be copied.

## Error Shape

Errors use:

- `code`: stable machine-readable code
- `message`: safe user-facing message
- `request_id`: opaque diagnostic identifier
- `details`: optional validated metadata with no raw CV text, credentials, or full provider responses

## Additive Evolution Rules

- Add new fields without breaking old clients
- Prefer optional fields over renaming fields
- Keep backward compatibility for existing response shapes
- Introduce new versions only when needed
