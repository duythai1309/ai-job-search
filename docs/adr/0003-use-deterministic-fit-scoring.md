# ADR 0003: Use Deterministic Fit Scoring

## Status

Accepted

## Context

The core product promise depends on explaining why a CV matches a job. A score produced by an LLM would be hard to reproduce, hard to audit, and too unstable for student demos.

## Decision

Use a deterministic scoring engine to compute the final fit score.

The score may use structured features such as:

- Skill overlap
- Experience level alignment
- Location fit
- Keyword evidence
- Role type fit

The LLM may help extract or normalize inputs, but it must not calculate the final score.

Every score result must include a scoring algorithm version, component breakdown, and input fingerprint. Changing feature weights or normalization rules requires a new scoring version and regression fixtures.

## Consequences

- Reproducible results
- Easier debugging and evaluation
- Clearer explanation of why a score changed
- Better testability

Tradeoffs:

- Less flexible than a model-driven ranking system
- Requires careful feature design
- Needs explicit calibration and documentation
