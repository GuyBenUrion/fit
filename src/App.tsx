import { useEffect } from 'react';
import AppRoutes from './routes';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const initAuth = useAppStore((s) => s.initAuth);
  const session = useAppStore((s) => s.session);
  const loadRoutines = useAppStore((s) => s.loadRoutines);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  useEffect(() => {
    if (session) loadRoutines();
  }, [session, loadRoutines]);

  return <AppRoutes />;
}
