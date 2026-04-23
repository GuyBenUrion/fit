import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const session = useAppStore((s) => s.session);
  const authLoading = useAppStore((s) => s.authLoading);
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
