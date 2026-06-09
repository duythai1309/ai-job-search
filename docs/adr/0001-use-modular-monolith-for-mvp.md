# ADR 0001: Use a Modular Monolith for the MVP

## Status

Accepted

## Context

The product needs a maintainable student-demo architecture for CV upload, CV analysis, Vietnam job discovery, deterministic fit scoring, and grounded recommendations. The team does not yet have a scaling or organizational need that justifies splitting the system into microservices.

## Decision

Use a modular monolith for the MVP.

The backend will run as a single FastAPI process with clearly separated internal modules for CV processing, jobs, scoring, recommendations, AI integration, storage, and audit concerns.

The frontend remains a separate Next.js deployable and Supabase remains managed infrastructure. Domain modules are not independently deployed services. A move to microservices requires a new ADR backed by measured scaling, reliability, or team-ownership needs.

## Consequences

- Simpler local development
- Lower deployment complexity
- Easier debugging and demo stability
- Easier sharing of domain models and validation logic
- Less operational overhead than microservices

Tradeoffs:

- Less independent scaling
- Fewer service boundaries for teams to own separately
- Some modules will need discipline to avoid becoming tightly coupled
