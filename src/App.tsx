import { useEffect } from 'react';
import AppRoutes from './routes';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const initAuth = useAppStore((s) => s.initAuth);
  const session = useAppStore((s) => s.session);
  const loadRoutines = useAppStore((s) => s.loadRoutines);
  const loadUserRoutines = useAppStore((s) => s.loadUserRoutines);
  const loadExercises = useAppStore((s) => s.loadExercises);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  useEffect(() => {
    if (!session) return;
    loadRoutines();
    loadUserRoutines();
    loadExercises();
  }, [session, loadRoutines, loadUserRoutines, loadExercises]);

  return <AppRoutes />;
}
