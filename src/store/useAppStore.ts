import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchRoutines } from '@/lib/api/routines';
import { fetchExercises } from '@/lib/api/exercises';
import {
  fetchUserRoutines,
  createUserRoutine,
  updateUserRoutine,
  deleteUserRoutine,
  type DraftRoutine,
} from '@/lib/api/userRoutines';
import type { Exercise, Routine } from '@/lib/types';

interface AppState {
  session: Session | null;
  user: User | null;
  authLoading: boolean;

  routines: Routine[];
  routinesLoading: boolean;
  routinesLoaded: boolean;

  userRoutines: Routine[];
  userRoutinesLoading: boolean;
  userRoutinesLoaded: boolean;

  exercises: Exercise[];
  exercisesLoading: boolean;
  exercisesLoaded: boolean;

  setSession: (session: Session | null) => void;
  initAuth: () => () => void;
  signOut: () => Promise<void>;
  loadRoutines: () => Promise<void>;
  loadUserRoutines: () => Promise<void>;
  loadExercises: () => Promise<void>;
  saveUserRoutine: (id: string | null, draft: DraftRoutine) => Promise<Routine>;
  removeUserRoutine: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  user: null,
  authLoading: true,

  routines: [],
  routinesLoading: false,
  routinesLoaded: false,

  userRoutines: [],
  userRoutinesLoading: false,
  userRoutinesLoaded: false,

  exercises: [],
  exercisesLoading: false,
  exercisesLoaded: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),

  initAuth: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({
        session: data.session,
        user: data.session?.user ?? null,
        authLoading: false,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, authLoading: false });
    });

    return () => sub.subscription.unsubscribe();
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      routines: [],
      routinesLoaded: false,
      routinesLoading: false,
      userRoutines: [],
      userRoutinesLoaded: false,
      userRoutinesLoading: false,
      exercises: [],
      exercisesLoaded: false,
      exercisesLoading: false,
    });
  },

  loadRoutines: async () => {
    if (!isSupabaseConfigured) return;
    const { routinesLoaded, routinesLoading } = get();
    if (routinesLoaded || routinesLoading) return;
    set({ routinesLoading: true });
    try {
      const routines = await fetchRoutines();
      set({ routines, routinesLoaded: true, routinesLoading: false });
    } catch (err) {
      console.error('Failed to load routines:', err);
      set({ routinesLoading: false });
    }
  },

  loadUserRoutines: async () => {
    if (!isSupabaseConfigured) return;
    const { userRoutinesLoaded, userRoutinesLoading } = get();
    if (userRoutinesLoaded || userRoutinesLoading) return;
    set({ userRoutinesLoading: true });
    try {
      const userRoutines = await fetchUserRoutines();
      set({
        userRoutines,
        userRoutinesLoaded: true,
        userRoutinesLoading: false,
      });
    } catch (err) {
      console.error('Failed to load user routines:', err);
      set({ userRoutinesLoading: false });
    }
  },

  loadExercises: async () => {
    if (!isSupabaseConfigured) return;
    const { exercisesLoaded, exercisesLoading } = get();
    if (exercisesLoaded || exercisesLoading) return;
    set({ exercisesLoading: true });
    try {
      const exercises = await fetchExercises();
      set({ exercises, exercisesLoaded: true, exercisesLoading: false });
    } catch (err) {
      console.error('Failed to load exercises:', err);
      set({ exercisesLoading: false });
    }
  },

  saveUserRoutine: async (id, draft) => {
    const saved = id
      ? await updateUserRoutine(id, draft)
      : await createUserRoutine(draft);
    const { userRoutines } = get();
    const next = id
      ? userRoutines.map((r) => (r.id === id ? saved : r))
      : [saved, ...userRoutines];
    set({ userRoutines: next });
    return saved;
  },

  removeUserRoutine: async (id) => {
    await deleteUserRoutine(id);
    const { userRoutines } = get();
    set({ userRoutines: userRoutines.filter((r) => r.id !== id) });
  },
}));
