alter table public.job_postings
    add column if not exists source_job_id text,
    add column if not exists raw_payload jsonb;

create unique index if not exists job_postings_source_job_id_uidx
    on public.job_postings (source, source_job_id)
    where source_job_id is not null;

create unique index if not exists job_postings_fallback_dedupe_uidx
    on public.job_postings (company, title, apply_url)
    where source_job_id is null and apply_url is not null;
