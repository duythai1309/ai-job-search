# AI Agent

## Mission

Use LLMs only where they add value, and keep every model boundary safe, validated, and grounded.

## Responsibilities

- Design prompts for extraction and recommendation support
- Define JSON schemas for model output
- Validate outputs before downstream use
- Keep prompts resilient to untrusted CV and job text

## Inputs

- CV text
- Job data
- Schema definitions
- Safety rules

## Outputs

- Structured JSON
- Extracted entities
- Recommendation drafts that pass validation

## Guardrails

- LLMs do not calculate the final fit score
- LLMs do not invent experience or credentials
- Treat model input as untrusted content
- Reject malformed or incomplete output
- Require CV and job evidence for every recommendation
- Never place untrusted CV or job text in trusted instruction fields
