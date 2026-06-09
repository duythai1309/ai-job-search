# ADR 0005: Use Tiered Job Data Fallback

## Status

Accepted

## Context

Job search quality will depend on external data availability. The MVP needs to work even when live job sources are rate limited, unavailable, or incomplete.

## Decision

Use a tiered job data strategy:

1. Approved job APIs and public feeds
2. Approved search APIs or legally accessible metadata
3. Seeded Vietnam job dataset as deterministic fallback

The system must not scrape search result pages or bypass access controls. Every job record carries source tier, source name, seeded status, and availability status. Seeded records are demo data and must not present sample application URLs as live opportunities.

## Consequences

- Better demo reliability
- Clear source priority
- Deterministic fallback for offline or unstable conditions
- Easier testing of the search and scoring pipeline

Tradeoffs:

- More source normalization work
- Must label fallback data clearly
- Need to prevent fallback data from being mistaken for live data
