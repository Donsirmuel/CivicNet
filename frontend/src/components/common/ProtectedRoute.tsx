import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';
import { profilesService } from '../../services/users';

function CenteredLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label={label}>
      <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function OfficialGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [verdict, setVerdict] = useState<'pending' | 'allow' | 'deny'>('pending');

  useEffect(() => {
    let cancelled = false;
    profilesService
      .getCurrentProfile()
      .then((profile) => {
        if (!cancelled) setVerdict(profile.role === 'official' ? 'allow' : 'deny');
      })
      .catch(() => {
        if (!cancelled) setVerdict('deny');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (verdict === 'pending') return <CenteredLoading label="Checking access" />;
  if (verdict === 'deny') return <Navigate to="/feed" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

/**
 * Route guard: requires a stored auth token; optionally requires the
 * `official` role (checked live against /profiles/me/).
 */
export default function ProtectedRoute({ requireOfficial = false }: { requireOfficial?: boolean }) {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireOfficial) {
    return (
      <OfficialGate>
        <Outlet />
      </OfficialGate>
    );
  }

  return <Outlet />;
}
