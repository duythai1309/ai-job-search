# API Coverage Matrix

| Endpoint | Frontend usage | Runtime validation | Notes |
|---|---|---|---|
| `POST /api/v1/cvs` | CV upload | Record ID checked before local tracking | Server persistence |
| `GET /api/v1/cvs/{cv_id}` | CV detail | Existing record normalization | No update endpoint |
| `DELETE /api/v1/cvs/{cv_id}` | CV deletion | HTTP/error handling | Server persistence |
| `POST /api/v1/cv-analyses` | CV analysis | Yes | Structured sections and suggestions |
| `GET /api/v1/jobs` | Job search and analytics | Yes | Normalizes `skills` and `apply_url` |
| `GET /api/v1/jobs/{job_id}` | Job detail | Yes | Unavailable/sample apply links disabled |
| `POST /api/v1/fit-scores` | Job fit evaluation | Yes | Deterministic backend score |
| `POST /api/v1/recommendations` | Job-specific CV guidance | Yes | Grounded structured suggestions |

## Not Covered By Backend MVP

- Profile persistence
- Application tracker persistence
- Saved-job persistence
- CV update persistence
- Chat or chat streaming

These features are either browser-local with explicit labels or disabled. No legacy API routes are used.
