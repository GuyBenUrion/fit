import { useEffect } from 'react';
import AppRoutes from './routes';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const initAuth = useAppStore((s) => s.initAuth);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  return <AppRoutes />;
}
