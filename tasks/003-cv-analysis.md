# Task 003: CV Analysis

## Goal

Turn extracted CV content into structured analysis that can support matching and recommendations.

## Scope

- Identify skills, education, experience, and projects
- Normalize CV data into a stable schema
- Produce validated structured output
- Version the analysis schema
- Display the structured analysis in a minimal review UI

## Out of Scope

- Final fit scoring
- Job search
- LLM-generated score judgments
- Cover letter generation

## Acceptance Criteria

- Analysis output is structured JSON
- Analysis output passes validation
- Analysis is grounded in the uploaded CV
- The system does not invent credentials or experience
- Invalid LLM JSON fails closed after at most one bounded retry

## Likely Files

- Future CV analysis service files
- Future schema validation files
- Future AI adapter files
- Future Next.js CV analysis components

## Test Expectations

- Structured output validation test
- Missing-section CV test
- Non-English CV text test
- No-hallucination safety test
- Prompt-injection-in-CV test
- Minimal analysis rendering test
