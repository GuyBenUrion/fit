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
  | 'stretch_mobility'
  | 'body_weight'
  | 'gym'
  | 'kb';

export type BodyPart =
  | 'hips'
  | 'hip_flexors'
  | 'hip_rotators'
  | 'glutes'
  | 'hamstrings'
  | 'quads'
  | 'adductors'
  | 'calves'
  | 'ankles'
  | 'feet'
  | 'lower_back'
  | 'core'
  | 'obliques'
  | 'lats'
  | 'mid_back'
  | 'chest'
  | 'shoulders'
  | 'rear_delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'neck'
  | 't_spine'
  | 'full_body';

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
  exerciseId: string;
  name: string;
  category: ExerciseCategory;
  bodyParts: BodyPart[];
  prescription: string;
  type: 'reps' | 'time';
  durationSec?: number;
  reps?: number;
  segments?: string[];
}

export interface Routine {
  id: string;
  name: string;
  durationMin: number;
  group: RoutineGroup;
  intensity: Intensity;
  whenToDo: string;
  whyItWorks: string;
  exercises: RoutineExercise[];
}
