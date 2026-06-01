import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import AccessDenied from '@/components/AccessDenied';

/**
 * @param {string | string[]} allowedRoles
 * @param {string} [loginRedirect] path for unauthenticated users
 */
export default function RoleRoute({ allowedRoles, loginRedirect = '/login' }) {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (isLoadingAuth) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[40vh] bg-rose-50">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    return <Navigate to={`${loginRedirect}?redirect=${redirect}`} replace />;
  }

  if (!roles.includes(user?.role)) {
    return <AccessDenied requiredRole={roles.join(' or ')} />;
  }

  return <Outlet />;
}
