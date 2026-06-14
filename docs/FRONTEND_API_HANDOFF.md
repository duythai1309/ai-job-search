# Frontend API Handoff

## Active Integration

- Frontend root: `web/frontend/src/app`
- API base: `NEXT_PUBLIC_API_BASE_URL`
- Teammate UI/UX remains the visual source of truth.

## Response Handling

- Job responses are validated and normalized before rendering.
- Backend `skills` maps to frontend `skills_required`.
- Backend `apply_url` maps to frontend `url`.
- Missing, seeded, sample, disabled, or unavailable apply URLs are not rendered as links.
- CV analysis, recommendation, and fit-score responses are validated at runtime.
- Error parsing supports nested `{ error: { code, message } }`, direct messages, plain text, and HTTP status fallback.

## Browser-Only Features

The MVP backend does not expose profile, application tracker, saved-job, CV update, or chat endpoints.

- Local keys use `vica:${userKey}:${resource}`.
- `userKey` is the Supabase user ID or `demo-user` when no identity is available.
- Profile, applications, and saved jobs are explicitly labeled as browser-local.
- CV edits and applied suggestions are preview-only.
- Chat controls are disabled with an explicit unavailable message.

## Integrated Backend

- The modular backend, deterministic matching flow, safe ingestion pipeline, and teammate API compatibility layer are integrated on the `frontend` branch.
- `GET /api/v1/jobs` supports `query`, `page_size`, and `level`.
- `POST /api/v1/cv-analyses` returns `overall_score`, `top_priorities`, and `sections`.
- `POST /api/v1/fit-scores` supports the frontend `{cv_id, job_id}` request and returns `score_total`.
- Recommendation priority tags match the frontend runtime validator.
- The frontend continues to use only canonical routes; legacy CV, job-search, and evaluate-fit routes are not restored.
- `POST /api/v1/jobs/ingest` is an explicit admin/development action and is never called during normal frontend startup.
- Apply `web/supabase/migrations/002_cloud_backend_mvp_alignment.sql` before enabling ingestion or backend MVP persistence against Supabase cloud.
- Supabase cloud is the database source of truth; `web/backend/migrations` are not applied directly to the existing cloud database.
- Existing cloud job fields remain supported: `skills_required` maps to `skills`, `url` maps to `apply_url`, and `raw_data` maps to `raw_payload`.
- Cloud UUID job IDs are serialized as strings in API responses.
- Backend authentication and CV ownership enforcement remain future work.
