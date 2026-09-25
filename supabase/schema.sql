-- ─────────────────────────────────────────────────────────────────────────────
-- EduEye — Supabase PostgreSQL Schema & Seed Migration
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Students Table
create table if not exists public.students (
  id text primary key,
  name text not null,
  roll_no text not null,
  branch text not null,
  semester integer not null,
  days_attended integer not null default 0,
  total_working_days integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Subjects & Academic Telemetry Table
create table if not exists public.subjects (
  id text primary key,
  student_id text references public.students(id) on delete cascade not null,
  code text not null,
  name text not null,
  faculty text not null,
  cat1_score numeric not null default 0,
  cat2_score numeric not null default 0,
  max_cat_score numeric not null default 50,
  assignment_rate numeric not null default 0,
  trend text not null check (trend in ('IMPROVING', 'DECLINING', 'STABLE')),
  deficit_score numeric not null default 0,
  concept_weaknesses text[] default array[]::text[],
  key_topics text[] default array[]::text[],
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Student Schedules & Chronotype Table
create table if not exists public.student_schedules (
  student_id text primary key references public.students(id) on delete cascade,
  chronotype text not null default 'MORNING' check (chronotype in ('MORNING', 'EVENING', 'NEUTRAL')),
  timezone text not null default 'Asia/Kolkata',
  weekly_baseline_events jsonb not null default '[]'::jsonb,
  upcoming_exams jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Active Calendar Events Table (Focus Sprints & Rebalanced Schedules)
create table if not exists public.calendar_events (
  id text primary key,
  student_id text references public.students(id) on delete cascade not null,
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  category text not null check (category in ('CLASS', 'PERSONAL', 'REMEDIATION_LOCK')),
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
  topic text,
  alert_score integer,
  is_rescheduled boolean default false,
  diff_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Google Calendar OAuth Tokens Table
create table if not exists public.user_calendar_tokens (
  student_id text primary key references public.students(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamp with time zone not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ── ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────────────
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.student_schedules enable row level security;
alter table public.calendar_events enable row level security;
alter table public.user_calendar_tokens enable row level security;

-- Public read policies for demo purposes
create policy "Allow public read access on students" on public.students for select using (true);
create policy "Allow public read access on subjects" on public.subjects for select using (true);
create policy "Allow public read access on schedules" on public.student_schedules for select using (true);
create policy "Allow public read access on calendar_events" on public.calendar_events for select using (true);
create policy "Allow authenticated/service write on calendar_events" on public.calendar_events for all using (true);
create policy "Allow public write on user_calendar_tokens" on public.user_calendar_tokens for all using (true);

-- ── SEED DATA (Ram's Telemetry & Routine) ──────────────────────────────────────

-- Insert Ram
insert into public.students (id, name, roll_no, branch, semester, days_attended, total_working_days)
values ('stu_ram_001', 'Ram', '21BCE1042', 'Computer Science & Engineering', 5, 41, 48)
on conflict (id) do update set
  days_attended = excluded.days_attended,
  total_working_days = excluded.total_working_days;

-- Insert Subjects
insert into public.subjects (id, student_id, code, name, faculty, cat1_score, cat2_score, max_cat_score, assignment_rate, trend, deficit_score, concept_weaknesses, key_topics)
values
  (
    'sub_la',
    'stu_ram_001',
    'MAT2001',
    'Linear Algebra',
    'Dr. K. Srinivasan',
    34,
    18,
    50,
    60,
    'DECLINING',
    82.5,
    array['Eigenvalue decomposition', 'Null space & column space', 'Orthogonality'],
    array['Eigenvalues & Eigenvectors', 'Orthogonal Projections', 'Gram-Schmidt Process', 'Matrix Diagonalization', 'Singular Value Decomposition (SVD)']
  ),
  (
    'sub_os',
    'stu_ram_001',
    'CSE3001',
    'Operating Systems',
    'Prof. Ananya Roy',
    41,
    44,
    50,
    95,
    'IMPROVING',
    12.0,
    array[]::text[],
    array['Virtual Memory & Paging', 'CPU Scheduling Algorithms', 'Deadlock Detection & Avoidance', 'Synchronization Primitives', 'File System Architecture']
  ),
  (
    'sub_ds',
    'stu_ram_001',
    'CSE2001',
    'Data Structures & Algorithms',
    'Dr. M. Venkat',
    38,
    43,
    50,
    88,
    'IMPROVING',
    18.5,
    array['Graph traversal (DFS/BFS)', 'AVL tree rotations'],
    array['Balanced Binary Trees (AVL, Red-Black)', 'Shortest Path Algorithms (Dijkstra)', 'Dynamic Programming', 'Minimum Spanning Trees', 'Tries & Disjoint Sets']
  ),
  (
    'sub_cn',
    'stu_ram_001',
    'CSE3003',
    'Computer Networks',
    'Prof. Rajesh Kumar',
    36,
    40,
    50,
    80,
    'STABLE',
    28.0,
    array['Subnetting', 'Routing protocols (OSPF, BGP)'],
    array['IPv4/IPv6 Addressing & CIDR', 'TCP Congestion Control', 'Link-State Routing (OSPF)', 'DNS & DHCP Architecture', 'TLS/SSL Handshake Protocol']
  )
on conflict (id) do update set
  cat1_score = excluded.cat1_score,
  cat2_score = excluded.cat2_score,
  assignment_rate = excluded.assignment_rate,
  deficit_score = excluded.deficit_score;

-- Insert Student Schedule Record
insert into public.student_schedules (student_id, chronotype, timezone, weekly_baseline_events, upcoming_exams)
values (
  'stu_ram_001',
  'MORNING',
  'Asia/Kolkata',
  '[
    {"id":"base_college_mon","title":"College — Lectures","category":"CLASS","status":"SCHEDULED","dowPattern":[1,2,3,4,5],"startHHMM":"09:30","endHHMM":"13:00","topic":"Scheduled Lectures"},
    {"id":"base_lab_tue","title":"Lab Session — CS","category":"CLASS","status":"SCHEDULED","dowPattern":[2,4],"startHHMM":"14:00","endHHMM":"16:00","topic":"Lab Work"},
    {"id":"base_lunch","title":"Lunch","category":"PERSONAL","status":"SCHEDULED","dowPattern":[0,1,2,3,4,5,6],"startHHMM":"13:00","endHHMM":"14:00","topic":null},
    {"id":"base_rest","title":"Rest & Downtime","category":"PERSONAL","status":"SCHEDULED","dowPattern":[0,1,2,3,4,5,6],"startHHMM":"22:00","endHHMM":"23:59","topic":null},
    {"id":"base_gym","title":"Gym / Exercise","category":"PERSONAL","status":"SCHEDULED","dowPattern":[1,3,5],"startHHMM":"07:00","endHHMM":"08:00","topic":null},
    {"id":"base_study_group","title":"DS Study Group","category":"PERSONAL","status":"SCHEDULED","dowPattern":[3],"startHHMM":"17:00","endHHMM":"18:30","topic":"Data Structures"},
    {"id":"base_weekend_morning","title":"Weekend Morning Block","category":"PERSONAL","status":"SCHEDULED","dowPattern":[0,6],"startHHMM":"09:00","endHHMM":"10:00","topic":null}
  ]'::jsonb,
  '[
    {"subjectId":"sub_la","subjectName":"Linear Algebra","examType":"CAT3","examDate":"2026-10-15","priority":"CRITICAL"},
    {"subjectId":"sub_cn","subjectName":"Computer Networks","examType":"CAT3","examDate":"2026-10-17","priority":"HIGH"},
    {"subjectId":"sub_ds","subjectName":"Data Structures","examType":"CAT3","examDate":"2026-10-20","priority":"MEDIUM"}
  ]'::jsonb
)
on conflict (student_id) do update set
  chronotype = excluded.chronotype,
  weekly_baseline_events = excluded.weekly_baseline_events,
  upcoming_exams = excluded.upcoming_exams;
