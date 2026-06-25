## Frontend Integration - Teammate UI

Decision:

- The teammate frontend is the visual source of truth.
- The only compiled frontend root is `web/frontend/src/app`.
- UI structure, colors, spacing, typography, cards, navigation, icons, animations, and page hierarchy are preserved from teammate commit `a2a7154`.

Completed:

- Restored the teammate landing page and authenticated app pages after the temporary MVP placeholder UI introduced in `7a042cf`.
- Removed the duplicate root `web/frontend/app` and deleted the inactive `_legacy_app` quarantine copy.
- Removed inactive AI-generated `web/frontend/components` and `web/frontend/lib` placeholder modules.
- Removed AI-generated routes `/cv-upload`, `/cv-analysis`, `/job-matches`, and `/cv-recommendations`.
- Kept the teammate routes and journey: landing, auth, onboarding, dashboard, jobs, applications, CV, analytics, and profile.
- Normalized frontend API calls to the current MVP contract:
  - `POST /api/v1/cvs`
  - `GET /api/v1/cvs/{cv_id}`
  - `DELETE /api/v1/cvs/{cv_id}`
  - `POST /api/v1/cv-analyses`
  - `GET /api/v1/jobs`
  - `GET /api/v1/jobs/{job_id}`
  - `POST /api/v1/fit-scores`
  - `POST /api/v1/recommendations`
- Kept applications and profile state local because the MVP backend does not expose those resources.
- Bundled Plus Jakarta Sans and DM Sans locally so the teammate typography is preserved without a build-time Google Fonts request.

Verification:

- `web/frontend`: `npm run typecheck` passed.
- `web/frontend`: `npm run build` passed.
- `web/backend`: `.venv\Scripts\python.exe -m pytest` passed (`1 passed`).

Safety:

- Backend source was not changed.
- Course logging infrastructure was not changed.
- Environment files were not added to the commit scope.

## Frontend Data Correctness Hardening

Decision:

- Preserve the teammate UI/UX while making browser-only state and unavailable MVP capabilities explicit.
- Normalize and validate backend responses before rendering them.

Completed:

- Mapped backend job fields `skills` and `apply_url` to the existing teammate view model.
- Disabled apply links for missing, unavailable, or seeded sample URLs.
- Scoped profile, applications, saved jobs, and CV browser state by Supabase user ID with `demo-user` fallback.
- Marked CV edits and suggestion application as local preview state, not server persistence.
- Updated profile, application, and saved-job messages to state that data is stored locally.
- Disabled chat inputs because the MVP backend has no chat endpoint.
- Replaced realtime, sector, and salary claims with labels grounded in the currently available job records.
- Added manual runtime validation and nested/plain-text API error extraction.
- Added Node built-in pure-function tests for job normalization, storage isolation, validators, and error extraction.

Safety:

- Teammate layout, colors, spacing, typography, cards, icons, animations, and page hierarchy were preserved.
- Backend application code and course logging hooks were not changed.
- No environment files or secrets were added.

## Backend Branch Integration

Completed:

- Integrated the modular backend prerequisites followed by the safe job ingestion and teammate API compatibility commits.
- Preserved the active teammate frontend at `web/frontend/src/app`; no frontend source or configuration files changed.
- Added deterministic seed ingestion, disabled-by-default live source adapters, normalization, filtering, deduplication, and repository upsert.
- Added frontend-compatible job query aliases, CV analysis presentation fields, single-job fit scoring, recommendation priority tags, and nested error details.
- Preserved canonical backend request and response fields alongside additive compatibility fields.

Safety:

- No `.env`, `.env.local`, secrets, frontend UI files, or course logging hooks were changed.
- Live Supabase, Gemini, and scraper calls remain outside the test suite.
- `0006_add_job_ingestion_fields.sql` must be applied before live Supabase ingestion/upsert.

## Supabase Cloud Schema Alignment

Decision:

- Treat the running Supabase cloud database as the source of truth.
- Adapt backend repositories to existing UUID job IDs and legacy job columns.
- Do not recreate `job_postings` or apply backend-local migrations directly to
  the cloud database.

Completed:

- Added cloud-row normalization for `skills_required`, `url`, and `raw_data`.
- Preserved UUID job IDs and serialized them as API strings.
- Changed ingestion IDs to deterministic UUIDs.
- Added dual-write ingestion payloads for existing and compatibility job columns.
- Added a clear `job_ingestion_schema_not_ready` response when required additive
  columns are absent.
- Added `web/supabase/migrations/002_cloud_backend_mvp_alignment.sql` to add
  compatibility columns, backfill legacy data, and create missing MVP tables.
- Added fake-client tests for old/new cloud rows, UUID IDs, dual-write payloads,
  schema readiness errors, and UUID-like fit-score job IDs.

Safety:

- No tables or columns are dropped.
- `job_postings.id` remains UUID.
- Existing `skills_required`, `url`, and `raw_data` columns remain intact.
- No live Supabase, scraping, or AI calls are made by tests.
- No frontend UI/UX files or secrets are changed.

## UX/UI Pro-Max Frontend Enhancements

Decision:
- Enable modern, space-filling multi-column layouts on desktop for major views (CV Builder, Job Search, Profile) while preserving mobile responsiveness.
- Align `CVSection` types between frontend client definitions and REST endpoint serialization schemas to eliminate compilation type conflicts.

Completed:
- Designed responsive split panes with sticky widgets on desktop and graceful tabbed layouts on mobile for CV Editor and Profile screens.
- Reconstructed suggestion application rules to cleanly process both `add` (item append) and `remove` (item exclusion/filter) action types in Next.js state.
- Integrated dynamic HTML generation in mock resolvers to automatically preview CV modifications in real-time.
- Verified compilation and optimized asset generation via successful TypeScript typechecks and production Next.js builds.

Safety:
- Backend code, Supabase schemas, and logging structures were untouched.
- Next.js build passes cleanly without compilation failures.

## Consolidated Market Analytics Redesign (IT & Data Careers)

Decision:
- Redesign the Market Analytics view into a high-fidelity, unified market report dashboard for the entire IT & Data technology sector, completely removing the granular individual role selectors and sidebar accordions.
- Use a typographic, minimalist single-page dashboard format with no icons, placing the Market Insights section at the very top of the page.
- Limit the colors to a clean, monochromatic navy blue (`#005288`) and slate brand palette to project a highly professional, academic report style.
- Embed comprehensive, curated regional data (salaries, locations, skills, trending tools) in the client layer to provide a rich analytics experience even if backend adapters are inactive or in compatibility stub mode.

Completed:
- Replaced the placeholder analytics page with a full-width, single-page professional dashboard featuring typographic layout styling and no decorative icons.
- Placed the expert insights section at the top of the dashboard, styled with a prominent left-border navy indicator.
- Designed 4 overview metric cards (Openings, Active Companies, Growth %, Avg Salary) with built-in monochromatic sparkline charts.
- Custom-built Recharts Horizontal BarChart and AreaChart utilizing a unified Navy Blue fill and border style.
- Replaced all colorful tags, icons, and status backgrounds with clean, high-contrast borders and text lists.
- Validated compiler safety via successful strict TypeScript checks (`npx tsc --noEmit`).

Safety:
- No changes to backend routing or Supabase schemas.
- Excluded complex state tracking for 12 individual roles, simplifying frontend code and improving page performance.


