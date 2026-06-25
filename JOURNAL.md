## Week 1

We clarified the MVP direction for VICA:
CV upload and analysis → Vietnam job discovery → deterministic fit score → grounded CV recommendations.

We used ChatGPT and Codex to convert earlier Claude-style project ideas into a spec-driven workflow with AGENTS.md, ADRs, task files, and implementation guardrails.

## Week 2

We completed the UI/UX enhancement phase for desktop screens:
- Restructured main product screens (CV builder, Job Search, Profile) to use split-pane columns to resolve empty space issues.
- Fixed logical bugs in the CV suggestion application mechanism to properly support insertion and removal recommendation events.
- Hardened code type safety across component properties, mock APIs, and domain types, ensuring a clean Next.js build compilation.
