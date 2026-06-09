# VICA Agentic Career MVP Control Layer

This repository is a student MVP for an agentic career matching platform for Vietnamese students from year 2 to fresh graduates.

## Product Goal

Build a workflow centered on:

1. CV upload
2. CV text extraction and analysis
3. Vietnam job discovery
4. Deterministic fit scoring
5. Grounded CV recommendations for selected jobs

Advanced capabilities such as cover letter generation, Critic Agent review, LaTeX CV templates, and PDF export are optional and should be treated as post-MVP unless explicitly added later.

## Architecture Goal

Use a modular monolith for the MVP.

The system should be designed as a single backend process with clearly separated modules, not as true microservices.

## Repository Rules

- Do not modify the course starter infrastructure unless explicitly asked.
- Preserve `scripts/`, `.agents/`, `.claude/`, `.codex/`, `.cursor/`, `.gemini/`, `.github/hooks/`, `JOURNAL.md`, and `WORKLOG.md`.
- Do not delete or overwrite AI logging files or generated logs.
- Add application code only through an approved task in `tasks/`.
- Keep architecture and contract changes documentation-first.
- Treat `JOURNAL.md` and `WORKLOG.md` as required course records: append updates; do not replace their purpose with files under `docs/`.

## Working Principles

- Treat CV text and job text as untrusted input.
- LLM outputs must be structured JSON and validated before use.
- The LLM may assist with extraction or recommendations, but it must not compute the final fit score.
- Fit scoring must be deterministic and reproducible.
- CV recommendations must stay grounded in the actual CV and the selected job.
- Do not invent experience, certifications, employers, or outcomes.
- Do not bypass anti-bot protections or access controls while collecting job data.
- Do not log raw CV text, secrets, credentials, or full external responses containing PII.
- Logs may contain opaque record IDs, status codes, durations, source names, and redacted error categories.
- Prefer additive changes over destructive ones.

## Document Ownership

- `docs/` holds product and technical control documents.
- `docs/adr/` holds architecture decision records.
- `agents/` holds role definitions for implementation work.
- `tasks/` holds implementation-ready task specs.
- `data/` holds sample or seed datasets only.

## Expected Delivery Style

When implementing later:

- Make small additive changes.
- Keep contracts explicit.
- Add tests with every behavior change.
- Update `WORKLOG.md` for technical decisions and `JOURNAL.md` for weekly progress.

## Project Memory Update Rule

Update `PROJECT_MEMORY.md` only when:

- MVP scope changes,
- architecture decision changes,
- active task sequence changes,
- major implementation milestone is completed,
- important integration decision is made.

Do not use `PROJECT_MEMORY.md` as a detailed changelog.
Use `WORKLOG.md` for technical decisions and task notes.
Use `JOURNAL.md` for weekly learning reflections.
