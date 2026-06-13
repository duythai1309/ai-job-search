create table if not exists public.cv_analyses (
    id uuid primary key default gen_random_uuid(),
    cv_id uuid not null references public.cv_documents(id) on delete cascade,
    schema_version text not null,
    profile_json jsonb not null,
    model_name text null,
    validation_state text not null check (validation_state in ('validated')),
    created_at timestamptz not null default now()
);

create index if not exists cv_analyses_cv_created_idx
    on public.cv_analyses (cv_id, created_at desc);

alter table public.cv_analyses enable row level security;

comment on table public.cv_analyses is
    'Validated structured CV analyses. Server-side access only until auth policies are added.';
