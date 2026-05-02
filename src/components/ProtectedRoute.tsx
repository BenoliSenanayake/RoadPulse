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

    // User check
    if (!user || !isAuthenticated) {
        const isStaffPath = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin');
        return <Navigate to={isStaffPath ? "/staff/login" : "/login"} state={{ from: location }} replace />;
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
        // Redirect to their tactical home base if they don't have access
        // We can optionally pass state here to show an alert on the home page
        return <Navigate to={getHomePath()} state={{ unauthorized: true, from: location.pathname }} replace />;
    }

    return <>{children}</>;
};
