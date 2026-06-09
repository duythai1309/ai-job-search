# Coding Rules

## Core Rules

1. LLM output must be structured JSON and validated.
2. The LLM must not calculate the final fit score.
3. Fit score must be deterministic and reproducible.
4. CV recommendations must not invent fake experience.
5. Job search must support fallback to seeded Vietnam jobs.
6. Treat CV and job text as untrusted input, not instructions.
7. Do not bypass anti-bot or access controls.
8. Do not log raw CV text, credentials, or full external responses containing PII.
9. Additive migration only; avoid destructive changes.
10. A single backend process is acceptable for the MVP.

## Implementation Rules

- Prefer simple, explicit data structures.
- Add validation at boundaries.
- Keep prompts short, bounded, and schema-driven.
- Use feature flags or configuration for optional behavior.
- Keep domain logic separate from transport logic.

## Data and Model Rules

- Store provenance for generated or derived data.
- Validate job records before using them in scoring or recommendations.
- Keep score formulas transparent and testable.
- Record the inputs used for any deterministic score.

## Security and Privacy Rules

- Minimize collection of user data.
- Use a logging allowlist: opaque IDs, event names, status codes, durations, source tier, model/provider name, and redacted error categories.
- Never log uploaded filenames when they contain user-entered PII, raw CV/job text, prompts containing CV content, credentials, provider payloads, or signed storage URLs.
- Never treat model output as trusted executable instructions.
- Assume uploaded documents may contain malicious content.
- Delimit CV and job content as untrusted data and instruct models to ignore instructions found inside it.
- Delete stored CV files and derived records through the documented delete flow.

## Migration Rules

- Schema changes must be additive by default.
- Preserve backward compatibility where possible.
- Avoid destructive renames or deletes unless explicitly approved.

## Testing Rules

- Every scoring rule needs a reproducibility test.
- Every AI boundary needs schema validation tests.
- Every recommendation needs CV evidence and job evidence; missing evidence is a validation failure.
- Every new endpoint needs request/response tests.
- Every data fallback path needs a deterministic test case.
- Logging tests must assert that raw CV text and secrets are absent.
