import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type UserRole = 'user' | 'agent' | 'admin';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

const roleRedirects: Record<UserRole, string> = {
  user: '/participant',
  agent: '/agent',
  admin: '/admin',
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, user, isLoading } = useAuth();
  const location = useLocation()

  if (isLoading) {
    return null; // or spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace  state={{ from: location }} />;
  }

   // Authenticated but wrong role -> redirect to their own dashboard
  if (allowedRoles && !hasRole(allowedRoles) && user) {
    return <Navigate to={roleRedirects[user.role]} replace />;
  }



  // Use children if provided, otherwise use Outlet for nested routes
  return children ? children : <Outlet />;
}