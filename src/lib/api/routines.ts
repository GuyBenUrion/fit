import { supabase } from '@/lib/supabase';
import type {
  BodyPart,
  ExerciseCategory,
  Intensity,
  Routine,
  RoutineExercise,
  RoutineGroup,
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

interface RoutineExerciseRow {
  order_index: number;
  prescription: string;
  duration_sec: number | null;
  reps: number | null;
  segments: string[] | null;
  exercises: ExerciseRow;
}

interface RoutineRow {
  id: string;
  name: string;
  duration_min: number;
  group_name: RoutineGroup;
  intensity: Intensity;
  when_to_do: string;
  why_it_works: string;
  sort_order: number;
  routine_exercises: RoutineExerciseRow[];
}

function mapExercise(row: RoutineExerciseRow): RoutineExercise {
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
  return result;
}

function mapRoutine(row: RoutineRow): Routine {
  const exercises = [...row.routine_exercises]
    .sort((a, b) => a.order_index - b.order_index)
    .map(mapExercise);

  return {
    id: row.id,
    name: row.name,
    durationMin: row.duration_min,
    group: row.group_name,
    intensity: row.intensity,
    whenToDo: row.when_to_do,
    whyItWorks: row.why_it_works,
    exercises,
    source: 'catalog',
  };
}

export async function fetchRoutines(): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select(
      'id,name,duration_min,group_name,intensity,when_to_do,why_it_works,sort_order,' +
        'routine_exercises(order_index,prescription,duration_sec,reps,segments,' +
        'exercises(id,name,category,body_parts,type,default_duration_sec,default_reps,default_segments))',
    )
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data as unknown as RoutineRow[]).map(mapRoutine);
}
