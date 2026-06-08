create table if not exists public.summary_habit_records (
  namespace text not null,
  project_id text not null,
  record_id text not null,
  title text not null default 'Untitled summary training',
  status text not null default 'active' check (status in ('drafting', 'active', 'completed')),
  summary text not null default '',
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (namespace, project_id, record_id)
);

create index if not exists summary_habit_records_project_updated_idx
  on public.summary_habit_records (namespace, project_id, updated_at desc);

alter table public.summary_habit_records enable row level security;

drop policy if exists "summary_habit_records_select" on public.summary_habit_records;
create policy "summary_habit_records_select"
  on public.summary_habit_records
  for select
  using (true);

drop policy if exists "summary_habit_records_insert" on public.summary_habit_records;
create policy "summary_habit_records_insert"
  on public.summary_habit_records
  for insert
  with check (true);

drop policy if exists "summary_habit_records_update" on public.summary_habit_records;
create policy "summary_habit_records_update"
  on public.summary_habit_records
  for update
  using (true)
  with check (true);

drop policy if exists "summary_habit_records_delete" on public.summary_habit_records;
create policy "summary_habit_records_delete"
  on public.summary_habit_records
  for delete
  using (true);
