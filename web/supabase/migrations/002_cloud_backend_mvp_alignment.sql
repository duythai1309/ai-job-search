-- Cloud-safe alignment for the existing VICA Supabase database.
-- This migration is additive: it preserves existing tables, columns, IDs, and data.

alter table public.job_postings
    add column if not exists source_tier integer not null default 1
        check (source_tier between 1 and 3),
    add column if not exists is_seeded boolean not null default false,
    add column if not exists availability_status text not null default 'active',
    add column if not exists level text not null default '',
    add column if not exists role_type text,
    add column if not exists skills jsonb not null default '[]'::jsonb,
    add column if not exists apply_url text,
    add column if not exists salary_range text,
    add column if not exists source_job_id text,
    add column if not exists raw_payload jsonb,
    add column if not exists updated_at timestamptz not null default now();

do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'job_postings'
          and column_name = 'external_id'
    ) then
        execute $sql$
            update public.job_postings
            set source_job_id = external_id
            where source_job_id is null and external_id is not null
        $sql$;
    end if;

    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'job_postings'
          and column_name = 'is_active'
    ) then
        execute $sql$
            update public.job_postings
            set availability_status = case
                when is_active then 'active'
                else 'inactive'
            end
        $sql$;
    end if;

    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'job_postings'
          and column_name = 'skills_required'
    ) then
        execute $sql$
            update public.job_postings
            set skills = to_jsonb(skills_required)
            where (skills is null or skills = '[]'::jsonb)
              and skills_required is not null
        $sql$;
    end if;

    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'job_postings'
          and column_name = 'url'
    ) then
        execute $sql$
            update public.job_postings
            set apply_url = url
            where apply_url is null and url is not null
        $sql$;
    end if;

    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'job_postings'
          and column_name = 'raw_data'
    ) then
        execute $sql$
            update public.job_postings
            set raw_payload = raw_data
            where raw_payload is null and raw_data is not null
        $sql$;
    end if;
end
$$;

-- A non-partial unique index is required for PostgREST
-- on_conflict=source,source_job_id. PostgreSQL permits multiple NULL values.
create unique index if not exists job_postings_source_job_id_cloud_uidx
    on public.job_postings (source, source_job_id);

create index if not exists job_postings_title_location_cloud_idx
    on public.job_postings (title, location);

create table if not exists public.cv_documents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid null references auth.users(id) on delete cascade,
    filename text not null,
    content_type text not null,
    size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
    extraction_method text not null,
    extracted_text text not null,
    text_preview text not null,
    warnings jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists cv_documents_user_created_cloud_idx
    on public.cv_documents (user_id, created_at desc);

alter table public.cv_documents enable row level security;

create table if not exists public.cv_analyses (
    id uuid primary key default gen_random_uuid(),
    cv_id uuid not null references public.cv_documents(id) on delete cascade,
    schema_version text not null,
    profile_json jsonb not null,
    model_name text,
    validation_state text not null check (validation_state = 'validated'),
    created_at timestamptz not null default now()
);

create index if not exists cv_analyses_cv_created_cloud_idx
    on public.cv_analyses (cv_id, created_at desc);

alter table public.cv_analyses enable row level security;

create table if not exists public.job_matches (
    id uuid primary key default gen_random_uuid(),
    analysis_id uuid not null references public.cv_analyses(id) on delete cascade,
    job_id uuid not null references public.job_postings(id) on delete cascade,
    score integer not null check (score between 0 and 100),
    breakdown jsonb not null,
    matched_skills jsonb not null default '[]'::jsonb,
    missing_skills jsonb not null default '[]'::jsonb,
    scoring_version text not null,
    input_fingerprint text not null,
    calculated_at timestamptz not null default now()
);

create index if not exists job_matches_analysis_cloud_idx
    on public.job_matches (analysis_id, calculated_at desc);

alter table public.job_matches enable row level security;

create table if not exists public.cv_recommendations (
    id uuid primary key default gen_random_uuid(),
    cv_id uuid not null references public.cv_documents(id) on delete cascade,
    job_id uuid not null references public.job_postings(id) on delete cascade,
    schema_version text not null,
    priority text not null,
    suggestions jsonb not null default '[]'::jsonb,
    evidence_links jsonb not null default '[]'::jsonb,
    warnings jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists cv_recommendations_cv_job_cloud_idx
    on public.cv_recommendations (cv_id, job_id, created_at desc);

alter table public.cv_recommendations enable row level security;

comment on table public.cv_documents is
    'Backend-extracted CV documents; server-side access until ownership policies are added.';
comment on table public.cv_analyses is
    'Validated structured CV analyses; server-side access until ownership policies are added.';
comment on table public.job_matches is
    'Deterministic CV-to-job scores using UUID job_postings IDs.';
comment on table public.cv_recommendations is
    'Grounded CV recommendations linked to existing cloud jobs.';
