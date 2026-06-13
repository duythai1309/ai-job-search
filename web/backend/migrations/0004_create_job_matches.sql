create table if not exists public.job_matches (
    id uuid primary key default gen_random_uuid(),
    analysis_id uuid not null references public.cv_analyses(id) on delete cascade,
    job_id text not null references public.job_postings(id) on delete cascade,
    score integer not null check (score between 0 and 100),
    breakdown jsonb not null,
    matched_skills jsonb not null default '[]'::jsonb,
    missing_skills jsonb not null default '[]'::jsonb,
    scoring_version text not null,
    input_fingerprint text not null,
    calculated_at timestamptz not null default now()
);

create index if not exists job_matches_analysis_idx
    on public.job_matches (analysis_id, calculated_at desc);

alter table public.job_matches enable row level security;

comment on table public.job_matches is
    'Deterministic, versioned CV-to-job scores. Numeric scores are never produced by an LLM.';
