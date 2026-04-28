import { supabase } from '@/lib/supabase';
import { autoPrescription } from '@/lib/prescription';
import type {
  BodyPart,
  ExerciseCategory,
  Routine,
  RoutineExercise,
} from '@/lib/types';

interface ExerciseRow {
  id: string;
  name: string;
  category: ExerciseCategory;
  body_parts: BodyPart[];
  type: 'reps' | 'time';
  default_duration_sec: number | null;
  default_reps: number | null;
  default_segments: string[] | null;
}

interface UserRoutineExerciseRow {
  order_index: number;
  prescription: string;
  duration_sec: number | null;
  reps: number | null;
  segments: string[] | null;
  rest_sec: number | null;
  exercises: ExerciseRow;
}

interface UserRoutineRow {
  id: string;
  user_id: string;
  name: string;
  default_rest_sec: number;
  notes: string | null;
  updated_at: string;
  user_routine_exercises: UserRoutineExerciseRow[];
}

export interface DraftDrill {
  exerciseId: string;
  durationSec?: number;
  reps?: number;
  segments?: string[];
  restSec?: number;
}

export interface DraftRoutine {
  name: string;
  defaultRestSec: number;
  notes?: string;
  drills: DraftDrill[];
}

const SELECT =
  'id,user_id,name,default_rest_sec,notes,updated_at,' +
  'user_routine_exercises(order_index,prescription,duration_sec,reps,segments,rest_sec,' +
  'exercises(id,name,category,body_parts,type,default_duration_sec,default_reps,default_segments))';

function mapExercise(row: UserRoutineExerciseRow): RoutineExercise {
  const ex = row.exercises;
  const result: RoutineExercise = {
    exerciseId: ex.id,
    name: ex.name,
    category: ex.category,
    bodyParts: ex.body_parts,
    prescription: row.prescription,
    type: ex.type,
  };
  const durationSec = row.duration_sec ?? ex.default_duration_sec;
  if (durationSec !== null) result.durationSec = durationSec;
  const reps = row.reps ?? ex.default_reps;
  if (reps !== null) result.reps = reps;
  const segments = row.segments ?? ex.default_segments;
  if (segments !== null) result.segments = segments;
  if (row.rest_sec !== null) result.restSec = row.rest_sec;
  return result;
}

function totalDurationMin(row: UserRoutineRow): number {
  const drills = row.user_routine_exercises;
  let totalSec = 0;
  for (const d of drills) {
    const ex = d.exercises;
    const segCount = (d.segments ?? ex.default_segments)?.length ?? 1;
    const dur = d.duration_sec ?? ex.default_duration_sec ?? 0;
    totalSec += dur * segCount;
  }
  if (drills.length > 1) {
    let restSum = 0;
    for (let i = 0; i < drills.length - 1; i++) {
      const d = drills[i];
      if (!d) continue;
      restSum += d.rest_sec ?? row.default_rest_sec;
    }
    totalSec += restSum;
  }
  return Math.max(1, Math.round(totalSec / 60));
}

function mapRoutine(row: UserRoutineRow): Routine {
  const exercises = [...row.user_routine_exercises]
    .sort((a, b) => a.order_index - b.order_index)
    .map(mapExercise);

  const result: Routine = {
    id: row.id,
    name: row.name,
    durationMin: totalDurationMin(row),
    group: 'full_body',
    intensity: 'medium',
    whenToDo: '',
    whyItWorks: '',
    exercises,
    source: 'user',
    defaultRestSec: row.default_rest_sec,
    userId: row.user_id,
  };
  if (row.notes !== null) result.notes = row.notes;
  return result;
}

export async function fetchUserRoutines(): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('user_routines')
    .select(SELECT)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as UserRoutineRow[]).map(mapRoutine);
}

interface DrillContext {
  type: 'reps' | 'time';
  defaultDurationSec: number | null;
  defaultReps: number | null;
  defaultSegments: string[] | null;
}

async function loadExerciseContexts(
  ids: string[],
): Promise<Map<string, DrillContext>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from('exercises')
    .select('id,type,default_duration_sec,default_reps,default_segments')
    .in('id', ids);
  if (error) throw error;
  const map = new Map<string, DrillContext>();
  for (const row of data as unknown as Array<{
    id: string;
    type: 'reps' | 'time';
    default_duration_sec: number | null;
    default_reps: number | null;
    default_segments: string[] | null;
  }>) {
    map.set(row.id, {
      type: row.type,
      defaultDurationSec: row.default_duration_sec,
      defaultReps: row.default_reps,
      defaultSegments: row.default_segments,
    });
  }
  return map;
}

function buildDrillRow(
  draft: DraftDrill,
  ctx: DrillContext,
  orderIndex: number,
  userRoutineId: string,
) {
  const durationSec = draft.durationSec ?? ctx.defaultDurationSec ?? undefined;
  const reps = draft.reps ?? ctx.defaultReps ?? undefined;
  const segments = draft.segments ?? ctx.defaultSegments ?? undefined;
  const prescription = autoPrescription({
    type: ctx.type,
    durationSec,
    reps,
    segments,
  });
  return {
    user_routine_id: userRoutineId,
    exercise_id: draft.exerciseId,
    order_index: orderIndex,
    prescription,
    duration_sec: draft.durationSec ?? null,
    reps: draft.reps ?? null,
    segments: draft.segments ?? null,
    rest_sec: draft.restSec ?? null,
  };
}

async function insertDrills(routineId: string, drills: DraftDrill[]) {
  if (drills.length === 0) return;
  const ctxMap = await loadExerciseContexts(drills.map((d) => d.exerciseId));
  const rows = drills.map((d, i) => {
    const ctx = ctxMap.get(d.exerciseId);
    if (!ctx) throw new Error(`Unknown exercise: ${d.exerciseId}`);
    return buildDrillRow(d, ctx, i, routineId);
  });
  const { error } = await supabase.from('user_routine_exercises').insert(rows);
  if (error) throw error;
}

async function fetchOne(id: string): Promise<Routine> {
  const { data, error } = await supabase
    .from('user_routines')
    .select(SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  return mapRoutine(data as unknown as UserRoutineRow);
}

export async function createUserRoutine(draft: DraftRoutine): Promise<Routine> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const userId = userData.user?.id;
  if (!userId) throw new Error('Not signed in');

  const insert: {
    user_id: string;
    name: string;
    default_rest_sec: number;
    notes?: string | null;
  } = {
    user_id: userId,
    name: draft.name,
    default_rest_sec: draft.defaultRestSec,
    notes: draft.notes ?? null,
  };
  const { data, error } = await supabase
    .from('user_routines')
    .insert(insert)
    .select('id')
    .single();
  if (error) throw error;
  const routineId = (data as { id: string }).id;
  await insertDrills(routineId, draft.drills);
  return fetchOne(routineId);
}

export async function updateUserRoutine(
  id: string,
  draft: DraftRoutine,
): Promise<Routine> {
  const { error: updateErr } = await supabase
    .from('user_routines')
    .update({
      name: draft.name,
      default_rest_sec: draft.defaultRestSec,
      notes: draft.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (updateErr) throw updateErr;

  const { error: deleteErr } = await supabase
    .from('user_routine_exercises')
    .delete()
    .eq('user_routine_id', id);
  if (deleteErr) throw deleteErr;

  await insertDrills(id, draft.drills);
  return fetchOne(id);
}

export async function deleteUserRoutine(id: string): Promise<void> {
  const { error } = await supabase.from('user_routines').delete().eq('id', id);
  if (error) throw error;
}
