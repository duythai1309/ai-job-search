# Task 004: Job Discovery Vietnam

## Goal

Provide Vietnam internship and fresher job discovery with a reliable fallback dataset.

## Scope

- Implement the job provider interface
- Implement the seeded Vietnam provider as the required baseline
- Add at most one approved live API or public-feed adapter in this task
- Normalize job records
- Support seeded fallback jobs
- Label source tier and provenance
- Provide a minimal job search and results UI

## Out of Scope

- Anti-bot bypassing
- Private scraping that violates controls
- Final fit scoring
- Recommendation generation

## Acceptance Criteria

- The system can return relevant Vietnam job results
- The seeded provider alone satisfies the offline completion boundary
- The system falls back to seeded jobs when live data is unavailable
- Fallback data is clearly labeled
- Source provenance is preserved
- Seeded application URLs are not presented as live opportunities

## Likely Files

- Future job adapter files
- Future normalization module files
- Future seed dataset files
- Future Next.js job search and result components

## Test Expectations

- Live-source unavailable fallback test
- Job normalization test
- Vietnam location filter test
- Deterministic seed selection test
- Access-control and rate-limit policy review for any live adapter
- Search, empty-state, and fallback-label UI tests
