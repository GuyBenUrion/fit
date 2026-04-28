import { supabase } from '@/lib/supabase';
import type { BodyPart, Exercise, ExerciseCategory } from '@/lib/types';

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

function mapExercise(row: ExerciseRow): Exercise {
  const result: Exercise = {
    id: row.id,
    name: row.name,
    category: row.category,
    bodyParts: row.body_parts,
    type: row.type,
  };
  if (row.default_duration_sec !== null) result.defaultDurationSec = row.default_duration_sec;
  if (row.default_reps !== null) result.defaultReps = row.default_reps;
  if (row.default_segments !== null) result.defaultSegments = row.default_segments;
  return result;
}

export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id,name,category,body_parts,type,default_duration_sec,default_reps,default_segments')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data as unknown as ExerciseRow[]).map(mapExercise);
}
