-- ============================================================
-- JobViet AI — Initial Schema
-- ============================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  location text,
  phone text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  current_status text default 'unemployed'
    check (current_status in ('employed', 'unemployed', 'freelance', 'student')),
  target_roles text[] default '{}',
  target_locations text[] default '{}',
  deal_breakers text[] default '{}',
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "view_own_profile"   on public.profiles for select using (auth.uid() = id);
create policy "update_own_profile" on public.profiles for update using (auth.uid() = id);
create policy "insert_own_profile" on public.profiles for insert with check (auth.uid() = id);

-- Education
create table public.education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  degree text,
  field text,
  institution text,
  start_year int,
  end_year int,
  gpa numeric(3,2),
  thesis text,
  highlights text[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table public.education enable row level security;
create policy "manage_own_education" on public.education using (auth.uid() = user_id);

-- Experience
create table public.experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_title text not null,
  company text not null,
  location text,
  start_date date,
  end_date date,
  is_current boolean default false,
  responsibilities text[] default '{}',
  achievements text[] default '{}',
  technologies text[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table public.experience enable row level security;
create policy "manage_own_experience" on public.experience using (auth.uid() = user_id);

-- Skills
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text default 'primary'
    check (category in ('primary', 'secondary', 'domain', 'tool')),
  level text check (level in ('expert', 'advanced', 'intermediate', 'beginner')),
  years_experience numeric(4,1),
  created_at timestamptz default now()
);
alter table public.skills enable row level security;
create policy "manage_own_skills" on public.skills using (auth.uid() = user_id);

-- CVs
create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  target_role text,
  target_company text,
  profile_statement text,
  sections jsonb default '[]',
  html_content text,
  pdf_url text,
  is_master boolean default false,
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.cvs enable row level security;
create policy "manage_own_cvs" on public.cvs using (auth.uid() = user_id);

-- Cover letters
create table public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_posting_id uuid,
  title text,
  content text,
  html_content text,
  pdf_url text,
  language text default 'vi',
  created_at timestamptz default now()
);
alter table public.cover_letters enable row level security;
create policy "manage_own_cover_letters" on public.cover_letters using (auth.uid() = user_id);

-- Job postings (shared, populated by backend scraper)
create table public.job_postings (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text not null
    check (source in ('vietnamworks', 'topcv', 'itviec', 'careerviet', 'jobsgo', 'other')),
  title text not null,
  company text not null,
  company_logo_url text,
  location text,
  is_remote boolean default false,
  description text,
  requirements text[] default '{}',
  benefits text[] default '{}',
  salary_min bigint,
  salary_max bigint,
  salary_currency text default 'VND',
  salary_negotiable boolean default false,
  employment_type text
    check (employment_type in ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
  experience_years_min int,
  experience_years_max int,
  skills_required text[] default '{}',
  posted_at timestamptz,
  deadline timestamptz,
  url text unique not null,
  is_active boolean default true,
  scraped_at timestamptz default now(),
  raw_data jsonb,
  unique (source, external_id)
);
alter table public.job_postings enable row level security;
create policy "auth_view_jobs"    on public.job_postings for select using (auth.role() = 'authenticated');
create policy "service_manage_jobs" on public.job_postings using (auth.role() = 'service_role');

-- Applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_posting_id uuid references public.job_postings(id),
  cv_id uuid references public.cvs(id),
  cover_letter_id uuid references public.cover_letters(id),
  status text default 'bookmarked'
    check (status in ('bookmarked', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  fit_score numeric(5,2),
  fit_evaluation jsonb,
  salary_expected bigint,
  applied_at timestamptz,
  interview_at timestamptz,
  notes text,
  company_name text,
  role_title text,
  source_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.applications enable row level security;
create policy "manage_own_applications" on public.applications using (auth.uid() = user_id);

-- Seen jobs (dedup per user)
create table public.seen_jobs (
  user_id uuid references public.profiles(id) on delete cascade,
  job_posting_id uuid references public.job_postings(id) on delete cascade,
  seen_at timestamptz default now(),
  primary key (user_id, job_posting_id)
);
alter table public.seen_jobs enable row level security;
create policy "manage_own_seen_jobs" on public.seen_jobs using (auth.uid() = user_id);

-- Chat sessions
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'Cuộc trò chuyện mới',
  context_type text default 'general'
    check (context_type in ('general', 'job_evaluation', 'cv_review', 'interview_prep')),
  context_id uuid,
  created_at timestamptz default now()
);
alter table public.chat_sessions enable row level security;
create policy "manage_own_sessions" on public.chat_sessions using (auth.uid() = user_id);

-- Chat messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
alter table public.chat_messages enable row level security;
create policy "view_own_messages" on public.chat_messages for select
  using (exists (
    select 1 from public.chat_sessions cs
    where cs.id = session_id and cs.user_id = auth.uid()
  ));
create policy "insert_own_messages" on public.chat_messages for insert
  with check (exists (
    select 1 from public.chat_sessions cs
    where cs.id = session_id and cs.user_id = auth.uid()
  ));

-- CV suggestions (AI-generated per CV, optionally linked to a job)
create table public.cv_suggestions (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid references public.cvs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_posting_id uuid references public.job_postings(id),
  section text,
  suggestion_type text
    check (suggestion_type in ('weakness', 'keyword', 'reframe', 'add', 'remove')),
  original_text text,
  suggested_text text,
  reason text,
  is_applied boolean default false,
  created_at timestamptz default now()
);
alter table public.cv_suggestions enable row level security;
create policy "manage_own_suggestions" on public.cv_suggestions using (auth.uid() = user_id);

-- Market analytics (backend-populated, read-only for users)
create table public.market_analytics (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  source text,
  data jsonb not null,
  period text default 'weekly',
  date date not null,
  created_at timestamptz default now()
);
alter table public.market_analytics enable row level security;
create policy "auth_view_analytics" on public.market_analytics for select
  using (auth.role() = 'authenticated');

-- ── Triggers ────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at    before update on public.profiles    for each row execute function update_updated_at();
create trigger cvs_updated_at         before update on public.cvs         for each row execute function update_updated_at();
create trigger applications_updated_at before update on public.applications for each row execute function update_updated_at();

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Storage buckets ──────────────────────────────────────────
-- Run separately in Supabase dashboard or via CLI:
-- insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
