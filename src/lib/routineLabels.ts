import type { BodyPart, ExerciseCategory, Routine } from '@/lib/types';

export const routineGroupLabels: Record<Routine['group'], string> = {
  hip_mobility: 'Hip Mobility',
  legs: 'Legs / Lower Body',
  upper_body: 'Upper Body',
  full_body: 'Full Body',
  kb_only: 'KB Only',
  kb_bodyweight: 'KB + Bodyweight',
  gym: 'Gym',
  lower_body: 'Lower Body',
};

export const intensityLabels: Record<Routine['intensity'], string> = {
  light: 'Light',
  medium: 'Medium',
  deep: 'Deep',
  dynamic: 'Dynamic',
};

export const intensityBadgeClass: Record<Routine['intensity'], string> = {
  deep: 'bg-destructive/10 text-destructive',
  medium: 'bg-primary/10 text-primary',
  light: 'bg-muted text-muted-foreground',
  dynamic: 'bg-secondary text-secondary-foreground',
};

export const exerciseCategoryLabels: Record<ExerciseCategory, string> = {
  stretch_mobility: 'Stretch & Mobility',
  body_weight: 'Bodyweight',
  gym: 'Gym',
  kb: 'Kettlebell',
};

export const bodyPartLabels: Record<BodyPart, string> = {
  hips: 'Hips',
  hip_flexors: 'Hip Flexors',
  hip_rotators: 'Hip Rotators',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  quads: 'Quads',
  adductors: 'Adductors',
  calves: 'Calves',
  ankles: 'Ankles',
  feet: 'Feet',
  lower_back: 'Lower Back',
  core: 'Core',
  obliques: 'Obliques',
  lats: 'Lats',
  mid_back: 'Mid-Back',
  chest: 'Chest',
  shoulders: 'Shoulders',
  rear_delts: 'Rear Delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  neck: 'Neck',
  t_spine: 'T-Spine',
  full_body: 'Full Body',
};
