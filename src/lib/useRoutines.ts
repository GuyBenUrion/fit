import { useAppStore } from '@/store/useAppStore';
import type { Routine } from '@/lib/types';

export function useRoutines(): Routine[] {
  return useAppStore((s) => s.routines);
}

export function useRoutinesLoading(): boolean {
  return useAppStore((s) => s.routinesLoading);
}
