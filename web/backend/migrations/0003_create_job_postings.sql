create table if not exists public.job_postings (
    id text primary key,
    source text not null,
    source_tier integer not null check (source_tier between 1 and 3),
    is_seeded boolean not null default false,
    availability_status text not null default 'unknown',
    title text not null,
    company text not null,
    location text not null default '',
    employment_type text not null default '',
    level text not null default '',
    role_type text null,
    skills jsonb not null default '[]'::jsonb,
    description text not null default '',
    apply_url text null,
    posted_at date null,
    salary_range text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists job_postings_title_location_idx
    on public.job_postings (title, location);

alter table public.job_postings enable row level security;

comment on table public.job_postings is
    'Normalized jobs from approved sources. Seeded rows must remain visibly non-live.';

insert into public.job_postings (
    id, source, source_tier, is_seeded, availability_status, title, company,
    location, employment_type, level, skills, description, apply_url,
    posted_at, salary_range
)
values
    (
        'vnm-seed-001', 'seed', 3, true, 'sample',
        'Software Engineering Intern', 'Example Tech Vietnam',
        'Ho Chi Minh City', 'internship', 'student',
        '["JavaScript","TypeScript","React","Git"]'::jsonb,
        'Internship for students who want to build web applications and collaborate with product and engineering teams.',
        null, '2026-01-15', 'support stipend'
    ),
    (
        'vnm-seed-002', 'seed', 3, true, 'sample',
        'Data Analyst Fresher', 'Example Analytics Vietnam',
        'Hanoi', 'full-time', 'fresher',
        '["SQL","Python","Excel","Data Visualization"]'::jsonb,
        'Entry-level role focused on reporting, dashboarding, and data quality support.',
        null, '2026-01-20', 'negotiable'
    ),
    (
        'vnm-seed-003', 'seed', 3, true, 'sample',
        'UI/UX Design Intern', 'Example Studio Vietnam',
        'Da Nang', 'internship', 'student',
        '["Figma","Wireframing","User Research","Prototyping"]'::jsonb,
        'Support product design work with research, wireframes, and UI iteration.',
        null, '2026-01-18', 'support stipend'
    ),
    (
        'vnm-seed-004', 'seed', 3, true, 'sample',
        'Business Analyst Fresher', 'Example Services Vietnam',
        'Ho Chi Minh City', 'full-time', 'fresher',
        '["Requirements Gathering","SQL","Communication","Documentation"]'::jsonb,
        'Entry-level role supporting requirements analysis, stakeholder coordination, and documentation.',
        null, '2026-01-22', 'negotiable'
    ),
    (
        'vnm-seed-005', 'seed', 3, true, 'sample',
        'Marketing Intern', 'Example Growth Vietnam',
        'Hanoi', 'internship', 'student',
        '["Content Writing","Social Media","Canva","Analytics"]'::jsonb,
        'Support campaign execution, content planning, and basic performance analysis.',
        null, '2026-01-12', 'support stipend'
    )
on conflict (id) do nothing;
