# ADR 0006: Migrate Contracts Additively

## Status

Accepted

## Context

The MVP will evolve over time, but frequent destructive changes would make the student team lose time and break the demo.

## Decision

All contract, schema, and API evolution should be additive by default.

That means:

- Prefer new optional fields over renaming old ones
- Prefer new endpoints or versions over breaking old clients
- Avoid destructive schema changes unless explicitly approved
- Use expand-migrate-contract sequencing when an old field eventually needs removal
- Record deprecation before removal and keep rollback instructions for data migrations

## Consequences

- Safer incremental development
- Easier testing and rollback
- Better compatibility during team work

Tradeoffs:

- Some temporary duplication
- Schemas may become slightly broader over time
- Requires discipline to deprecate old fields later rather than deleting them immediately
