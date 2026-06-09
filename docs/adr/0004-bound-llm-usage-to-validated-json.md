# ADR 0004: Bound LLM Usage to Validated JSON

## Status

Accepted

## Context

LLM responses are useful for extraction, classification, and recommendations, but they are unreliable if used as free-form text in core product logic.

## Decision

Require LLM outputs to be structured JSON that is validated before use.

The system should:

- Use explicit schemas
- Validate model outputs
- Reject invalid or incomplete JSON
- Treat model output as untrusted until validated
- Reject recommendation items that lack evidence from both the CV and selected job
- Keep untrusted CV and job text in delimited data fields, separate from trusted instructions
- Use one bounded retry for malformed JSON, then return a typed failure or deterministic fallback

## Consequences

- Safer integration
- Easier downstream parsing
- Better control over recommendation structure
- Reduced risk of prompt injection effects

Tradeoffs:

- More upfront schema work
- More strict failure handling
- Some prompts will need retry or fallback paths
