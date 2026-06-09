# Data Strategy

## Data Goals

The system needs enough data to support:

- CV upload and analysis
- Vietnam job discovery
- Deterministic fit scoring
- Grounded recommendations
- Demo reliability when external sources are unavailable

## Source Tiers

### Tier 1: Approved Job APIs and Public Feeds

Use approved job APIs or public feeds first whenever available.

### Tier 2: Search or Metadata Discovery

Use approved search APIs or legally accessible metadata only as a secondary discovery path. Do not scrape search result pages or bypass rate limits, robots controls, authentication, CAPTCHAs, or other access controls.

### Tier 3: Seeded Vietnam Job Dataset

Use a seeded in-repo dataset as a deterministic fallback for demos and offline development.

## Seed Data Requirements

- Vietnam internships and fresher roles
- Enough variety in roles, locations, and skill requirements
- Deterministic structure
- No PII
- No fake claims about live availability
- Explicit `is_seeded: true` and `availability_status: "sample"`

## CV Data Handling

- Treat uploaded CV text as untrusted input
- Store only the minimum data needed for product behavior
- Avoid logging raw CV text, credentials, and full external responses containing PII
- Prefer derived structures over raw copies where possible
- Support deletion of the stored upload and its derived records

## Job Data Handling

- Normalize titles, companies, locations, skills, and level
- Track source tier and provenance
- Store the minimum fields needed to reproduce fit scores and recommendations
- Keep fallback data clearly labeled as seeded
- Do not expose sample `apply_url` values as actionable live links

## Determinism Rules

- Scoring inputs must be explicit and reproducible
- Fallback dataset selection must be predictable
- LLMs may help structure data, but they must not decide the final score

## Storage Guidance

- Use Supabase Postgres for structured data
- Use Supabase Storage for uploads and artifacts if needed
- Keep raw source documents separate from normalized records when possible

## Safety Rules

- Do not bypass anti-bot or access controls
- Do not scrape in ways that violate site terms or private system constraints
- Do not ingest secrets or credentials into logs
- Do not keep more sensitive data than necessary
- Operational logs may contain opaque IDs, source tier, status, duration, and redacted error codes
