import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-400">Loading…</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
