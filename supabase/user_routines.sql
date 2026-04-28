-- StretchPlanner — user-owned routines
-- Run this in the Supabase SQL editor after seed.sql.
-- Idempotent: safe to re-run.

-- ===== Schema =====
create table if not exists public.user_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  default_rest_sec int not null default 90,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_routines_user_id_idx on public.user_routines(user_id);

create table if not exists public.user_routine_exercises (
  id bigserial primary key,
  user_routine_id uuid not null references public.user_routines(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete restrict,
  order_index int not null,
  prescription text not null,
  duration_sec int,
  reps int,
  segments text[],
  rest_sec int,
  unique (user_routine_id, order_index)
);
create index if not exists user_routine_exercises_routine_id_idx
  on public.user_routine_exercises(user_routine_id);

-- ===== RLS: each user can only see / write their own =====
alter table public.user_routines enable row level security;
alter table public.user_routine_exercises enable row level security;

drop policy if exists "user_routines_owner_all" on public.user_routines;
create policy "user_routines_owner_all" on public.user_routines
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_routine_exercises_owner_all" on public.user_routine_exercises;
create policy "user_routine_exercises_owner_all" on public.user_routine_exercises
  for all to authenticated
  using (
    exists (
      select 1 from public.user_routines ur
      where ur.id = user_routine_id and ur.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_routines ur
      where ur.id = user_routine_id and ur.user_id = auth.uid()
    )
  );
