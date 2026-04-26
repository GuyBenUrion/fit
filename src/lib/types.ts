export type Activity =
  | 'muay_thai'
  | 'heavy_legs'
  | 'upper_lift'
  | 'crossfit'
  | 'enduro'
  | 'surf'
  | 'rest'
  | 'light';

export type RoutineType =
  | 'deep'
  | 'light_post_lift'
  | 'dynamic_warmup'
  | 'post_mt'
  | 'daily_mobility'
  | 'post_enduro';

export type Intensity = 'light' | 'medium' | 'deep' | 'dynamic';
export type LogIntensity = 'light' | 'medium' | 'heavy' | 'n/a';

export type ExerciseCategory =
  | 'hip_rotation'
  | 'hamstring'
  | 'adductor'
  | 'hip_flexor'
  | 'dynamic'
  | 'spine'
  | 'other';

export type TestResult = 'pass' | 'fail';
export type KickHeight = 'chest' | 'shoulder' | 'head';

export interface WeakPoints {
  hip_flexor?: TestResult;
  hamstring?: TestResult;
  adductor?: TestResult;
  hip_rotation?: TestResult;
}

export interface Profile {
  user_id: string;
  display_name: string | null;
  weak_points: WeakPoints;
  last_assessment_date: string | null;
  created_at: string;
}

export type RoutineGroup =
  | 'hip_mobility'
  | 'legs'
  | 'upper_body'
  | 'full_body'
  | 'kb_only'
  | 'kb_bodyweight'
  | 'gym'
  | 'lower_body';

export interface RoutineExercise {
  name: string;
  prescription: string;
  type: 'reps' | 'time';
  durationSec?: number;
  reps?: number;
  segments?: string[];
}

export interface Routine {
  id: string;
  number: number;
  name: string;
  durationMin: number;
  group: RoutineGroup;
  intensity: Intensity;
  whenToDo: string;
  whyItWorks: string;
  exercises: RoutineExercise[];
}
