-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  timezone text, -- detected from device on first launch, not hardcoded
  reminder_same_day boolean default true,
  reminder_1day boolean default true,
  reminder_3day boolean default true,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SEMESTERS
-- ============================================================
create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- COURSES
-- ============================================================
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  name text not null,
  instructor text,
  color text default '#6366f1',
  icon text default 'book',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PARSE RUNS (created before tasks — tasks reference it)
-- ============================================================
create table public.parse_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  upload_id uuid, -- FK added via ALTER after syllabus_uploads exists
  course_id uuid, -- FK added via ALTER after this block
  parse_version text not null default '1.0',
  method text not null, -- 'rule_only' | 'rule_plus_gemini'
  gemini_model text,
  parse_confidence numeric,
  normalized_text text,
  source_excerpts jsonb,
  final_results jsonb,
  items_accepted int,
  items_rejected int,
  raw_text text,
  error_message text,
  duration_ms int,
  created_at timestamptz default now()
);

-- ============================================================
-- TASKS
-- ============================================================
create type public.task_type as enum (
  'assignment', 'quiz', 'exam', 'project', 'reading', 'other'
);

create type public.source_type as enum (
  'manual', 'rule_parsed', 'gemini_parsed'
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  type public.task_type not null default 'assignment',
  due_date date not null,
  due_time time,
  weight numeric,
  is_completed boolean default false,
  completed_at timestamptz,
  source public.source_type default 'manual',
  parse_run_id uuid references public.parse_runs(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SYLLABUS UPLOADS
-- ============================================================
create table public.syllabus_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size_bytes int,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Deferred FK constraints for parse_runs
alter table public.parse_runs
  add constraint fk_parse_runs_upload
  foreign key (upload_id) references public.syllabus_uploads(id) on delete cascade;

alter table public.parse_runs
  add constraint fk_parse_runs_course
  foreign key (course_id) references public.courses(id) on delete cascade;

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_tasks_user_due on public.tasks(user_id, due_date);
create index idx_tasks_course on public.tasks(course_id);
create index idx_tasks_completed on public.tasks(user_id, is_completed, due_date);
create index idx_courses_semester on public.courses(semester_id);
create index idx_parse_runs_upload on public.parse_runs(upload_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.semesters enable row level security;
alter table public.courses enable row level security;
alter table public.tasks enable row level security;
alter table public.syllabus_uploads enable row level security;
alter table public.parse_runs enable row level security;

create policy "own_profiles" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own_semesters" on public.semesters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_courses" on public.courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_uploads" on public.syllabus_uploads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_parse_runs" on public.parse_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
