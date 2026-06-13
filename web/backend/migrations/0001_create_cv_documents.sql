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

create index if not exists cv_documents_user_created_idx
    on public.cv_documents (user_id, created_at desc);

alter table public.cv_documents enable row level security;

comment on table public.cv_documents is
    'Extracted CV documents. Access is server-side only until auth policies are added.';
