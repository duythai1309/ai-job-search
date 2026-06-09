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

## MVP Endpoints

- `POST /api/v1/cvs`: upload and synchronously extract one supported CV file; returns `201` with the normalized CV record
- `GET /api/v1/cvs/{cv_id}`: returns the authenticated user's normalized CV record
- `DELETE /api/v1/cvs/{cv_id}`: deletes the user's stored file and derived CV records
- `GET /api/v1/jobs`: accepts `query`, `location`, `level`, and pagination; returns normalized jobs plus source and fallback metadata
- `GET /api/v1/jobs/{job_id}`: returns one normalized job
- `POST /api/v1/fit-scores`: accepts `cv_id` and `job_id`; returns a deterministic `FitResult`
- `POST /api/v1/recommendations`: accepts `cv_id` and `job_id`; returns a validated `RecommendationResult`

All user-owned CV endpoints require authentication. Job browse may be public for the demo, while scoring and recommendations require access to the referenced CV.

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
