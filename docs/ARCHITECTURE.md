# Architecture

## Overview

The MVP uses a modular monolith:

- One backend process
- Clear internal modules
- Explicit contracts between modules
- Shared database and storage through Supabase
- Frontend and backend separated by API contracts, not by deployment boundaries

The deployable topology is one Next.js frontend, one FastAPI backend process, and one Supabase project. Internal domain modules are code boundaries, not independently deployed services.

## Why Modular Monolith

This is the right MVP choice because it keeps the system maintainable for a student team while avoiding the overhead of microservices.

Microservices would add:

- Deployment complexity
- Authentication and service-to-service authorization
- Networking and retries
- Distributed observability
- Data consistency overhead
- Harder local development

## Target Stack

- Frontend: Next.js, React, TypeScript, TailwindCSS
- Backend: FastAPI
- Database/Auth/Storage: Supabase
- AI provider: provider-neutral adapter supporting Gemini and OpenAI-compatible models
- Job data: approved public APIs or feeds first, approved search APIs or legally accessible metadata second, seeded Vietnam jobs dataset as deterministic fallback

## Suggested Module Boundaries

### Frontend

- Upload CV
- Show extracted CV summary
- Search and filter jobs
- Display fit score and explanation
- Display job-specific recommendations

### Backend

- CV ingestion and extraction
- CV normalization
- Job discovery and fallback selection
- Deterministic scoring
- Recommendation generation
- Supabase persistence
- AI adapter and validation

### Domain Modules

- `cv`
- `jobs`
- `scoring`
- `recommendations`
- `ai`
- `storage`
- `auth`
- `audit`

## Request Flow

1. User uploads CV
2. Backend extracts and normalizes CV content
3. Job discovery returns live results or seeded fallback data
4. Deterministic scorer compares CV and job data
5. LLM may help produce structured recommendations, but only after validation
6. Frontend renders score, match rationale, and recommendations

## Data Flow Rules

- CV text is untrusted input
- Job descriptions are untrusted input
- LLM outputs must be JSON and validated
- Final scoring must not depend on an LLM judgment
- The system must record enough metadata to reproduce the score

## Storage Strategy

- Supabase Auth for identity
- Supabase Postgres for structured records
- Supabase Storage for uploaded documents and derived artifacts
- Seed data in-repo for deterministic offline fallback

## Integration Principles

- Prefer simple internal function calls over distributed service calls
- Keep contracts explicit and additive
- Avoid destructive migrations
- Keep job-source adapters isolated so they can be swapped later
- Do not introduce queues, service discovery, or service-to-service authentication for MVP domain modules

## Failure Boundaries

- Invalid LLM output fails validation and is not persisted as trusted data
- Job-source failures fall through to the next approved tier
- Scoring runs only on validated, versioned CV and job inputs
- Logs contain identifiers and operational metadata, not raw CV or job payloads
