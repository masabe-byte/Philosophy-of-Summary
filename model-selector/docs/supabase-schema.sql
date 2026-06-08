-- Model Selector keeps one row per signed-in owner.
-- `libraries` stores shared API libraries and keys.
-- `projects` stores each business project's selection by projectCode.
-- New business projects can be created by the web app itself; no manual Supabase
-- table creation is required for each project.

create table if not exists public.model_selector_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  libraries jsonb not null default '{}'::jsonb,
  projects jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.model_selector_state enable row level security;

drop policy if exists "model_selector_state_select_own" on public.model_selector_state;
drop policy if exists "model_selector_state_insert_own" on public.model_selector_state;
drop policy if exists "model_selector_state_update_own" on public.model_selector_state;
drop policy if exists "model_selector_state_delete_own" on public.model_selector_state;

create policy "model_selector_state_select_own"
on public.model_selector_state
for select
using (auth.uid() = user_id);

create policy "model_selector_state_insert_own"
on public.model_selector_state
for insert
with check (auth.uid() = user_id);

create policy "model_selector_state_update_own"
on public.model_selector_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "model_selector_state_delete_own"
on public.model_selector_state
for delete
using (auth.uid() = user_id);
