import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/vault" replace />;
  }

  return children;
}
