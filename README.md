# Starter Code Template — Cohort 2

Empty starter template for AI20K Build Cohort 2 team repositories. Includes pre-configured AI usage logging hooks for Claude Code, Cursor, Codex, Gemini CLI, Antigravity, and GitHub Copilot.

## Structure

```
├── scripts/
│   ├── _pyrun.sh             # Cross-platform Python launcher (bash)
│   ├── _pyrun.cmd            # Cross-platform Python launcher (Windows)
│   ├── setup_hooks.sh        # One-time pre-push hook installer (POSIX)
│   ├── setup_hooks.ps1       # One-time pre-push hook installer (Windows)
│   ├── log_hook.py           # AI tool hook handler (Claude / Cursor / Codex / Gemini / Copilot)
│   ├── log_antigravity.py    # Auto-log hook for Antigravity
│   ├── log_manual.py         # Manual log for ChatGPT / web tools
│   └── submit_log.py         # Submits logs on git push
├── .agents/                  # Antigravity rules + workflows
├── .claude/  .codex/  .cursor/  .gemini/  .github/hooks/   # Per-tool hook configs
├── .env.example
├── JOURNAL.md                # Weekly journal — product journey & learnings
└── WORKLOG.md                # Technical decisions, task assignments, brainstorming
```

## Getting Started

### 1. Clone and install pre-push hook

**Linux / macOS / Git Bash:**
```bash
git clone <repo-url>
cd <repo>
bash scripts/setup_hooks.sh
```

**Windows PowerShell:**
```powershell
git clone <repo-url>
cd <repo>
powershell -ExecutionPolicy Bypass -File scripts\setup_hooks.ps1
```

### 2. Configure environment

```bash
cp .env.example .env       # macOS / Linux / Git Bash
# copy .env.example .env   # Windows cmd
```

Fill in `AI_LOG_SERVER` and `AI_LOG_API_KEY` (provided by the course).

### 3. Build your project

This is an empty starter — pick any language/framework. The hooks are language-agnostic; they only need Python on the host (any of `python3`, `python`, or `py` works).

## Weekly Journal

Update **[JOURNAL.md](./JOURNAL.md)** at the end of every week:

- Features shipped
- AI tools used and how they helped
- Hardest problem of the week and how you solved it
- What you'd do differently
- Plan for next week

> JOURNAL.md **must be updated** before each PR — it is your learning record for the course.

## Worklog

Update **[WORKLOG.md](./WORKLOG.md)** whenever your team makes a technical decision or changes direction:

- **Technical decisions** — why this approach over alternatives?
- **Task assignments** — who does what, by when
- **Brainstorming** — options considered, pros / cons, conclusion
- **Important bugs** — root cause and fix

## VICA MVP Workspace

The application skeleton follows the modular-monolith decision documented in
`docs/ARCHITECTURE.md`:

```text
web/
  frontend/   Next.js, React, TypeScript, TailwindCSS
  backend/    FastAPI application running as one backend process
data/         Deterministic Vietnam job seed data
```

Only health checks are implemented in the initial skeleton. CV upload, AI
calls, job discovery, scoring, and recommendations are intentionally absent.

### Frontend setup

Requirements: Node.js 20 or newer.

```bash
cd web/frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend health endpoint is:

```text
GET http://localhost:3000/api/health
```

### Backend setup

Requirements: Python 3.11 or newer.

```powershell
cd web/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
python -m uvicorn app.main:app --reload --env-file .env
```

For macOS, Linux, or Git Bash, activate the environment with:

```bash
source .venv/bin/activate
```

The backend runs at `http://localhost:8000`. Its versioned health endpoint is:

```text
GET http://localhost:8000/api/v1/health
```

The backend `.env` is loaded explicitly by Uvicorn. To use Gemini for CV
analysis and recommendations, configure:

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=<your key>
GEMINI_MODEL=<enabled model name>
AI_TIMEOUT_SECONDS=20
```

Leave `AI_PROVIDER` unset to keep the deterministic evidence-only fallback.
The active flow remains:

1. Upload PDF or DOCX.
2. Extract and persist CV text.
3. Analyze with Gemini or deterministic fallback.
4. Display the validated structured profile.
5. Load Supabase jobs or seeded fallback jobs.
6. Calculate deterministic fit scores.
7. Generate grounded recommendations.

Run the backend health test from `web/backend`:

```bash
python -m pytest
```

## AI Logging

Prompts and tool calls are **automatically logged** when you use any supported AI tool (Claude Code, Cursor, Codex, Gemini, Antigravity, Copilot). No manual steps needed after running `setup_hooks`.

For ChatGPT or other web tools, log manually:

```bash
# POSIX
bash scripts/_pyrun.sh scripts/log_manual.py --tool chatgpt --prompt "<what you did>"

# Windows
scripts\_pyrun.cmd scripts\log_manual.py --tool chatgpt --prompt "<what you did>"
```

### Python requirements

The hook system needs **one** of: `python3`, `python`, or `py` on PATH.

| OS | Recommended install |
|---|---|
| Windows | Python 3 from [python.org](https://www.python.org/downloads/) — installer adds both `python` and `py` to PATH |
| Ubuntu / Debian | `sudo apt install python3` (already preinstalled on most distros) |
| macOS | `brew install python3` or use system Python 3 |

The `scripts/_pyrun.*` wrappers detect whichever is available — students do not need to alias `python3` → `python`.
