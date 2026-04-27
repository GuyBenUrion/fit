// Generates supabase/seed.sql from:
//   - existing supabase/seed.sql (for the routines INSERT block, which is unchanged)
//   - scripts/exercises_catalog.json (canonical exercise catalog)
//   - scripts/routine_exercises.json (the 325 routine_exercises rows from the live DB)
//
// Run: `node scripts/buildSeed.mjs`. Writes to supabase/seed.sql in place.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const SEED_PATH = path.join(root, 'supabase', 'seed.sql');
const CATALOG_PATH = path.join(here, 'exercises_catalog.json');
const ROUTINE_EX_PATH = path.join(here, 'routine_exercises.json');

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
const rxns = JSON.parse(fs.readFileSync(ROUTINE_EX_PATH, 'utf8'));

// --- Same canonicalization map as buildCatalog.mjs (kept in sync) ---
const REMAP = {
  '90/90 stretch — right lead': { canon: '90/90 stretch', side: 'Right lead' },
  '90/90 stretch — left lead': { canon: '90/90 stretch', side: 'Left lead' },
  '90/90 active lift-offs — right': { canon: '90/90 active lift-offs', side: 'Right' },
  '90/90 active lift-offs — left': { canon: '90/90 active lift-offs', side: 'Left' },
  'Half pigeon with forward fold (right)': { canon: 'Half pigeon with forward fold', side: 'Right' },
  'Half pigeon with forward fold (left)': { canon: 'Half pigeon with forward fold', side: 'Left' },
  'Pigeon pose right': { canon: 'Pigeon pose', side: 'Right' },
  'Pigeon pose left': { canon: 'Pigeon pose', side: 'Left' },
  '90/90 right — passive then 5 lift-offs': { canon: '90/90 passive + lift-offs', side: 'Right' },
  '90/90 left — passive then 5 lift-offs': { canon: '90/90 passive + lift-offs', side: 'Left' },
  'Pigeon left (with fold)': { canon: 'Pigeon pose with fold', side: 'Left' },
  'Pigeon right (with fold)': { canon: 'Pigeon pose with fold', side: 'Right' },
  'Pigeon pose right (active — lift back knee 5x, then relax)': { canon: 'Pigeon pose (active lift-offs)', side: 'Right' },
  'Pigeon pose left (active — lift back knee 5x, then relax)': { canon: 'Pigeon pose (active lift-offs)', side: 'Left' },
  'A1: Lat pulldown': { canon: 'Lat pulldown' },
  'A2: DB shoulder press': { canon: 'DB shoulder press' },
  'B1: Seated cable row': { canon: 'Seated cable row' },
  'B2: Incline DB press': { canon: 'Incline DB press' },
  'C1: Face pull': { canon: 'Face pull' },
  'C2: DB lateral raise': { canon: 'DB lateral raise' },
  'D1: DB bicep curl': { canon: 'DB bicep curl' },
  'D2: Triceps pushdown': { canon: 'Triceps pushdown' },
};

const slugByCanon = new Map(catalog.map(e => [e.name, e.id]));
const exByCanon = new Map(catalog.map(e => [e.name, e]));

// --- SQL helpers ---
const Q = '$q$';
const dq = s => `${Q}${s}${Q}`;                          // dollar-quoted text literal
const dqa = arr => arr === null || arr === undefined
  ? 'null'
  : `array[${arr.map(v => dq(v)).join(',')}]::text[]`;   // text[] literal
const orNull = (v, fmt) => v === null || v === undefined ? 'null' : fmt(v);

// --- Extract routines INSERT block from existing seed.sql verbatim (lines 44..93 in current file) ---
const oldSeed = fs.readFileSync(SEED_PATH, 'utf8').split(/\r?\n/);
const routinesStart = oldSeed.findIndex(l => l.startsWith('-- Routines (40)'));
if (routinesStart < 0) throw new Error('cannot locate "-- Routines (40)" marker in existing seed.sql');
let routinesEnd = routinesStart;
while (routinesEnd < oldSeed.length && !oldSeed[routinesEnd].startsWith('  sort_order = excluded.sort_order;')) routinesEnd++;
if (routinesEnd === oldSeed.length) throw new Error('cannot locate end of routines INSERT in existing seed.sql');
const routinesBlock = oldSeed.slice(routinesStart, routinesEnd + 1).join('\n');

// --- Build exercises INSERT ---
function exerciseRow(e) {
  return `  (${dq(e.id)}, ${dq(e.name)}, ${dq(e.category)}, ${dqa(e.body_parts)}, ${dq(e.type)}, ${orNull(e.default_duration_sec, v => v)}, ${orNull(e.default_reps, v => v)}, ${orNull(e.default_segments, v => dqa(v).replace('array', 'array'))})`;
}
// Note: the dqa helper already returns "array[...]::text[]" or "null", so no .replace needed; keeping orNull/dqa simple.
function exerciseRowClean(e) {
  return `  (${dq(e.id)}, ${dq(e.name)}, ${dq(e.category)}, ${dqa(e.body_parts)}, ${dq(e.type)}, ${e.default_duration_sec === null ? 'null' : e.default_duration_sec}, ${e.default_reps === null ? 'null' : e.default_reps}, ${dqa(e.default_segments)})`;
}

const exercisesInsert = [
  '-- Exercises catalog (' + catalog.length + ')',
  'insert into public.exercises (id, name, category, body_parts, type, default_duration_sec, default_reps, default_segments) values',
  catalog.map((e, i) => exerciseRowClean(e) + (i === catalog.length - 1 ? '' : ',')).join('\n'),
  'on conflict (id) do update set',
  '  name = excluded.name,',
  '  category = excluded.category,',
  '  body_parts = excluded.body_parts,',
  '  type = excluded.type,',
  '  default_duration_sec = excluded.default_duration_sec,',
  '  default_reps = excluded.default_reps,',
  '  default_segments = excluded.default_segments;',
].join('\n');

// --- Build routine_exercises INSERT ---
// For each row, derive canonical name + (optional) side, look up exercise defaults,
// and emit override columns only when they differ from defaults.
function arraysEqual(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const joinRows = rxns.map(r => {
  const remap = REMAP[r.name];
  const canon = remap?.canon ?? r.name;
  const ex = exByCanon.get(canon);
  if (!ex) throw new Error(`No catalog entry for canonical "${canon}" (orig "${r.name}")`);

  // Effective per-row segments: side override if remapped, else original
  const effectiveSegments = remap?.side ? [remap.side] : r.segments;
  const segOverride = arraysEqual(effectiveSegments, ex.default_segments) ? null : effectiveSegments;

  // duration_sec override
  const durOverride = (r.duration_sec ?? null) === (ex.default_duration_sec ?? null) ? null : r.duration_sec;
  // reps override
  const repsOverride = (r.reps ?? null) === (ex.default_reps ?? null) ? null : r.reps;

  return {
    routine_id: r.routine_id,
    exercise_id: ex.id,
    order_index: r.order_index,
    prescription: r.prescription,
    duration_sec: durOverride,
    reps: repsOverride,
    segments: segOverride,
  };
});

function joinRow(r) {
  return `  (${dq(r.routine_id)}, ${dq(r.exercise_id)}, ${r.order_index}, ${dq(r.prescription)}, ${r.duration_sec === null || r.duration_sec === undefined ? 'null' : r.duration_sec}, ${r.reps === null || r.reps === undefined ? 'null' : r.reps}, ${dqa(r.segments ?? null)})`;
}

const routineExInsert = [
  '-- Routine ↔ Exercise links (' + joinRows.length + ' rows)',
  '-- Override columns (duration_sec, reps, segments) are NULL when this use of the exercise matches the catalog default.',
  '-- Effective values at read time = COALESCE(routine_exercises.X, exercises.default_X).',
  'insert into public.routine_exercises (routine_id, exercise_id, order_index, prescription, duration_sec, reps, segments) values',
  joinRows.map((r, i) => joinRow(r) + (i === joinRows.length - 1 ? ';' : ',')).join('\n'),
].join('\n');

// --- Final SQL document ---
const routineIdsList = [...new Set(rxns.map(r => r.routine_id))]
  .map(id => `  ${dq(id)}`).join(',\n');

const out = `-- StretchPlanner routines seed
-- Generated by scripts/buildSeed.mjs
-- Idempotent: re-running this file upserts routines + exercises and replaces routine_exercises.

-- ===== Schema =====
create table if not exists public.routines (
  id text primary key,
  name text not null,
  duration_min int not null,
  group_name text not null,
  intensity text not null check (intensity in ('light','medium','deep','dynamic')),
  when_to_do text not null,
  why_it_works text not null,
  sort_order int not null
);

create table if not exists public.exercises (
  id text primary key,
  name text not null unique,
  category text not null check (category in ('stretch_mobility','body_weight','gym','kb')),
  body_parts text[] not null,
  type text not null check (type in ('reps','time')),
  default_duration_sec int,
  default_reps int,
  default_segments text[]
);
create index if not exists exercises_category_idx on public.exercises(category);

-- routine_exercises is a pure routine ↔ exercise join. The override columns
-- (duration_sec, reps, segments) are NULL when this routine's use of the exercise
-- matches the catalog default; non-NULL when it diverges.
drop table if exists public.routine_exercises cascade;
create table public.routine_exercises (
  id bigserial primary key,
  routine_id text not null references public.routines(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete restrict,
  order_index int not null,
  prescription text not null,
  duration_sec int,
  reps int,
  segments text[],
  unique (routine_id, order_index)
);
create index routine_exercises_routine_id_idx on public.routine_exercises(routine_id);
create index routine_exercises_exercise_id_idx on public.routine_exercises(exercise_id);

-- ===== RLS: shared catalog, readable by any signed-in user =====
alter table public.routines enable row level security;
alter table public.exercises enable row level security;
alter table public.routine_exercises enable row level security;

drop policy if exists "routines_read_authenticated" on public.routines;
create policy "routines_read_authenticated" on public.routines
  for select to authenticated using (true);

drop policy if exists "exercises_read_authenticated" on public.exercises;
create policy "exercises_read_authenticated" on public.exercises
  for select to authenticated using (true);

drop policy if exists "routine_exercises_read_authenticated" on public.routine_exercises;
create policy "routine_exercises_read_authenticated" on public.routine_exercises
  for select to authenticated using (true);

-- ===== Data =====

${routinesBlock}

${exercisesInsert}

-- Replace routine_exercises atomically for the seeded routines
delete from public.routine_exercises where routine_id in (
${routineIdsList}
);

${routineExInsert}
`;

fs.writeFileSync(SEED_PATH, out);
console.log('Wrote', SEED_PATH);
console.log('  routines block:', routinesEnd - routinesStart + 1, 'lines');
console.log('  exercises:', catalog.length);
console.log('  routine_exercises rows:', joinRows.length);
const overrideCounts = {
  duration_sec: joinRows.filter(r => r.duration_sec !== null && r.duration_sec !== undefined).length,
  reps: joinRows.filter(r => r.reps !== null && r.reps !== undefined).length,
  segments: joinRows.filter(r => r.segments !== null && r.segments !== undefined).length,
};
console.log('  rows with overrides:', overrideCounts);
