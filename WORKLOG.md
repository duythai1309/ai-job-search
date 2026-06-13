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
