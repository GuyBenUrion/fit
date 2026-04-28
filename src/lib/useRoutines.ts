import { useAppStore } from '@/store/useAppStore';
import type { Exercise, Routine } from '@/lib/types';

export function useRoutines(): Routine[] {
  return useAppStore((s) => s.routines);
}

export function useRoutinesLoading(): boolean {
  return useAppStore((s) => s.routinesLoading);
}

export function useUserRoutines(): Routine[] {
  return useAppStore((s) => s.userRoutines);
}

export function useUserRoutinesLoading(): boolean {
  return useAppStore((s) => s.userRoutinesLoading);
}

export function useExercises(): Exercise[] {
  return useAppStore((s) => s.exercises);
}

export function useExercisesLoading(): boolean {
  return useAppStore((s) => s.exercisesLoading);
}
