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
