# Agent Flow

## Agent Model

The MVP can use specialized roles, but they should cooperate inside one product boundary rather than act like separate services.

## Recommended Flow

1. Product agent defines the task and acceptance criteria
2. Backend agent designs the data and API shape
3. Data agent prepares job and CV data contracts
4. AI agent defines prompts, JSON schema, and safety checks
5. Frontend agent implements the user experience
6. QA agent validates behavior, contracts, and regression risks

## Role Responsibilities

### Product Agent

- Clarify user value
- Prioritize MVP scope
- Keep post-MVP features out of the core path
- Maintain acceptance criteria

### Backend Agent

- Design FastAPI modules
- Implement extraction, scoring, and persistence logic
- Keep the backend as one process for the MVP
- Protect deterministic scoring boundaries

### Frontend Agent

- Build Next.js interfaces
- Present job results, fit scores, and recommendations clearly
- Avoid UI that suggests unsupported certainty

### AI Agent

- Design prompt templates and schema validation
- Keep LLM output structured JSON
- Ensure the LLM cannot override deterministic scoring
- Ensure recommendations stay grounded

### Data Agent

- Define job seed data
- Manage source tiers and fallback strategy
- Normalize job records
- Avoid collecting data in ways that violate access controls

### QA Agent

- Test end-to-end flows
- Validate score reproducibility
- Verify schema and safety rules
- Ensure no raw sensitive data is logged

## Handoff Rules

- Every role should pass explicit inputs and outputs
- Contracts should be written down before code starts
- No role should assume hidden context
- Any new field or payload must be documented first

## Non-Goals

- The roles do not imply separate runtime services
- The roles do not replace engineering ownership
- The roles do not justify premature complexity

