import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AppState {
  session: Session | null;
  user: User | null;
  authLoading: boolean;

  setSession: (session: Session | null) => void;
  initAuth: () => () => void;
  signOut: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  session: null,
  user: null,
  authLoading: true,

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
    set({ session: null, user: null }); 
  },
}));
