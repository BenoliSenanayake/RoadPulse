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

    const portalMode = import.meta.env.VITE_PORTAL_MODE || 'citizen';

    // User check
    if (!user || !isAuthenticated) {
        const loginPath = portalMode === 'staff' ? "/staff/login" : portalMode === 'admin' ? "/admin/login" : "/login";
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    // Portal Firewall: Ensure user role matches the running portal mode
    if (portalMode === 'citizen' && user.role !== 'CITIZEN') {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center font-black uppercase tracking-widest text-slate-400">Portal Restricted to Citizens</div>;
    }
    if (portalMode === 'staff' && user.role !== 'MAINTENANCE_OFFICER') {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center font-black uppercase tracking-widest text-slate-400">Portal Restricted to Maintenance Officers</div>;
    }
    if (portalMode === 'admin' && user.role !== 'ADMIN') {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center font-black uppercase tracking-widest text-slate-400">Portal Restricted to Administrators</div>;
    }

    // Specific route permission check
    if (allowedRoles && !hasRole(allowedRoles)) {
        return <Navigate to={getHomePath()} state={{ unauthorized: true, from: location.pathname }} replace />;
    }

    return <>{children}</>;
};
