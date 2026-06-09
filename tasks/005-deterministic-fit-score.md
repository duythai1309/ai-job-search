# Task 005: Deterministic Fit Score

## Goal

Create a reproducible score that compares a CV against a selected job.

## Scope

- Define score features
- Implement a deterministic formula
- Produce a score breakdown
- Make the output reproducible from the same inputs
- Version the scoring formula and fingerprint normalized inputs
- Display the total score and component breakdown for a selected job

## Out of Scope

- LLM-based scoring
- Free-form ranking judgments
- Recommendation generation
- Multi-service scoring orchestration

## Acceptance Criteria

- The same inputs always produce the same score
- The score breakdown is explainable
- The LLM is not used as the final scorer
- Tests document the formula and edge cases
- The response includes `scoring_version` and `input_fingerprint`

## Likely Files

- Future scoring module files
- Future scoring tests
- Future contract models
- Future Next.js score summary component

## Test Expectations

- Reproducibility test
- Feature-weight test
- Missing-data test
- Regression test for score stability
- Score breakdown rendering test
