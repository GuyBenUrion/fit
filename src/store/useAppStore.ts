import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchRoutines } from '@/lib/api/routines';
import type { Routine } from '@/lib/types';

interface AppState {
  session: Session | null;
  user: User | null;
  authLoading: boolean;

  routines: Routine[];
  routinesLoading: boolean;
  routinesLoaded: boolean;

  setSession: (session: Session | null) => void;
  initAuth: () => () => void;
  signOut: () => Promise<void>;
  loadRoutines: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  user: null,
  authLoading: true,

  routines: [],
  routinesLoading: false,
  routinesLoaded: false,

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
}));
