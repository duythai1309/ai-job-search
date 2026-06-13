create table if not exists public.cv_recommendations (
    id uuid primary key,
    cv_id uuid not null references public.cv_documents(id) on delete cascade,
    job_id text not null,
    schema_version text not null,
    priority text not null,
    suggestions jsonb not null default '[]'::jsonb,
    evidence_links jsonb not null default '[]'::jsonb,
    warnings jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists cv_recommendations_cv_job_idx
    on public.cv_recommendations (cv_id, job_id, created_at desc);
