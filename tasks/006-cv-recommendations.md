# Task 006: CV Recommendations

## Goal

Generate grounded suggestions that help the user improve their CV for a selected job.

## Scope

- Compare the CV with the selected job
- Identify missing evidence, keyword gaps, and tailoring opportunities
- Produce structured recommendations
- Validate the recommendation payload
- Display recommendations and their supporting evidence

## Out of Scope

- Fabricating experience
- Cover letter generation
- Final fit score calculation
- Unbounded free-form LLM output

## Acceptance Criteria

- Recommendations are tied to the selected job
- Recommendations are grounded in actual CV evidence
- Recommendations do not invent experience
- Output is structured and validated
- Every suggestion includes evidence from both the CV and selected job
- Invalid or ungrounded model output fails closed

## Likely Files

- Future recommendation service files
- Future prompt templates
- Future schema definitions
- Future Next.js recommendation components

## Test Expectations

- Grounding test
- No-hallucination test
- Schema validation test
- Selected-job specificity test
- Prompt-injection-in-job-description test
- Recommendation evidence rendering test
