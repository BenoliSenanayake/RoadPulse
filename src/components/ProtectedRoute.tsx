import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, isAuthenticated, hasRole, getHomePath } = useAuth();
    const location = useLocation();
    const currentPath = `${location.pathname}${location.search}`;

    // User check
    if (!user || !isAuthenticated) {
        const isStaffPath = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/potholes');
        const loginPath = isStaffPath
            ? "/staff/login"
            : `/login?returnTo=${encodeURIComponent(currentPath)}`;
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    // Role-based route guards (Firewall)
    const isStaffRoute = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/potholes');
    const isCitizenRoute = location.pathname.startsWith('/citizen');

    if (user.role === 'CITIZEN' && isStaffRoute) {
        console.warn('Citizen attempted to access staff route, redirecting to /citizen');
        return <Navigate to="/citizen" replace />;
    }

    if (user.role === 'MAINTENANCE_OFFICER' && (isCitizenRoute || location.pathname.startsWith('/admin'))) {
        return <Navigate to="/staff/overview" replace />;
    }

    if (user.role === 'ADMIN' && isCitizenRoute) {
        return <Navigate to="/admin/overview" replace />;
    }

    // Explicit role check for the specific route
    if (allowedRoles && !hasRole(allowedRoles)) {
        return <Navigate to={getHomePath()} state={{ unauthorized: true, from: location.pathname }} replace />;
    }

    return <>{children}</>;
};
