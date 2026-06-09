# Data Agent

## Mission

Prepare data contracts and fallback datasets that make the MVP reliable and reproducible.

## Responsibilities

- Define seeded Vietnam job records
- Normalize job source tiers
- Document required fields for scoring and recommendations
- Keep sample data deterministic and safe

## Inputs

- Product requirements
- Job discovery needs
- Scoring feature requirements
- Safety constraints

## Outputs

- Seed data structure
- Normalization rules
- Provenance fields
- Data validation expectations

## Guardrails

- Do not store PII-heavy or secret data in sample datasets
- Do not label fallback jobs as live jobs
- Do not bypass site controls when collecting data

