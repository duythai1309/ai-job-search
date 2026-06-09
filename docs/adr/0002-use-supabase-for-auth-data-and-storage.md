# ADR 0002: Use Supabase for Auth, Data, and Storage

## Status

Accepted

## Context

The MVP needs authentication, structured persistence, and file storage without adding multiple infrastructure systems that would slow a student team down.

## Decision

Use Supabase for:

- Authentication
- Postgres-backed structured data
- File storage for uploads and derived artifacts

## Consequences

- Faster MVP setup
- Fewer moving parts
- A clear path for user identity and persistence
- A good fit for a student demo environment

Tradeoffs:

- Some platform coupling to Supabase APIs
- Need to plan schema changes carefully
- Storage and auth logic should be abstracted enough to allow future replacement if needed

