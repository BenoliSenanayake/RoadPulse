import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole, ProvincialCouncil } from '../types';
import { authApi } from '../lib/api';
import { canonicalizeProvince } from '../lib/provinceResolver';

export interface CitizenAccount extends User {
    passwordHash: string; // Simple hash/plain for prototype
    createdAt: string;
    phone?: string;
    district?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string, provincialCouncil?: ProvincialCouncil) => Promise<{ success: boolean; error?: string; user?: User }>;
    signup: (data: Omit<CitizenAccount, 'id' | 'role' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
    hasRole: (roles: UserRole[]) => boolean;
    getHomePath: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage Keys
const USER_KEY = 'rp_user';
const PROVINCE_KEY = 'provincialCouncil';

const getUserProvince = (source: any, fallback?: string | null) => {
    return source?.provincialCouncil
        || source?.provincial_council
        || source?.selectedProvince
        || source?.province
        || fallback
        || '';
};

const normalizeStoredUser = (storedUser: any): User => {
    const rawProvince = getUserProvince(storedUser);
    const provincialCouncil = rawProvince ? canonicalizeProvince(rawProvince) : undefined;
    return {
        ...storedUser,
        provincialCouncil
    };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // Current Session
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem(USER_KEY);
            return saved ? normalizeStoredUser(JSON.parse(saved)) : null;
        } catch (e) {
            console.error("[Auth] Failed to parse user from storage", e);
            localStorage.removeItem(USER_KEY);
            return null;
        }
    });

    useEffect(() => {
        const token = localStorage.getItem('roadpulse_token');
        console.log(`[Auth Context] Initialized. User: ${user?.email || 'None'}, Role: ${user?.role || 'None'}, Token Present: ${!!token}`);
    }, []);

    const persistSessionUser = (sessionUser: User, token?: string) => {
        console.log(`[Auth Context] Persisting session for ${sessionUser.email}. Token provided: ${!!token}`);
        setUser(sessionUser);
        localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
        if (token) {
            localStorage.setItem('roadpulse_token', token);
        }
        if (sessionUser.provincialCouncil) {
            localStorage.setItem(PROVINCE_KEY, sessionUser.provincialCouncil);
            sessionStorage.setItem(PROVINCE_KEY, sessionUser.provincialCouncil);
        } else {
            localStorage.removeItem(PROVINCE_KEY);
            sessionStorage.removeItem(PROVINCE_KEY);
        }
    };

    const login = async (email: string, password?: string, provincialCouncil?: ProvincialCouncil) => {
        const portalMode = import.meta.env.VITE_PORTAL_MODE || 'citizen';

        // Staff login logic (requires provincialCouncil match)
        if (portalMode === 'staff') {
            if (!provincialCouncil) {
                return { success: false, error: 'Please select your Provincial Council.' };
            }

            try {
                const response = await authApi.login(email, password, provincialCouncil);
                if (!response || !response.user) {
                    return { success: false, error: 'Login failed.' };
                }
                if (response.user.role !== 'MAINTENANCE_OFFICER') {
                    return { success: false, error: 'Unauthorized: This portal is only for maintenance officers.' };
                }

                const officerProvince = canonicalizeProvince(getUserProvince(response.user, provincialCouncil));
                if (officerProvince === 'Unassigned') {
                    return { success: false, error: 'Officer province is missing. Please sign in again.' };
                }

                const sessionUser: User = {
                    id: response.user.id,
                    name: response.user.name,
                    email: response.user.email,
                    role: 'MAINTENANCE_OFFICER',
                    provincialCouncil: officerProvince,
                    status: 'ACTIVE',
                    createdAt: new Date().toISOString()
                };

                persistSessionUser(sessionUser, response.token);
                return { success: true, user: sessionUser };
            } catch (e: any) {
                return { success: false, error: e.message || 'Invalid credentials.' };
            }
        }

        // Admin login logic
        if (portalMode === 'admin') {
            try {
                const response = await authApi.login(email, password);
                if (!response || !response.user || response.user.role !== 'ADMIN') {
                    return { success: false, error: 'Unauthorized: This portal is only for administrators.' };
                }

                const sessionUser: User = {
                    id: response.user.id,
                    name: response.user.name,
                    email: response.user.email,
                    role: response.user.role,
                    provincialCouncil: getUserProvince(response.user) ? canonicalizeProvince(getUserProvince(response.user)) : undefined,
                    status: 'ACTIVE',
                    createdAt: new Date().toISOString()
                };

                persistSessionUser(sessionUser, response.token);
                return { success: true, user: sessionUser };
            } catch (e: any) {
                return { success: false, error: e.message || 'Invalid credentials.' };
            }
        }

        // Citizen login logic
        if (portalMode === 'citizen') {
            try {
                console.log(`[Auth Context] Citizen login attempt: ${email}`);
                const response = await authApi.login(email, password);
                if (response && response.user && response.token) {
                    const sessionUser: User = {
                        id: response.user.id,
                        name: response.user.name,
                        email: response.user.email,
                        role: 'CITIZEN',
                        status: 'ACTIVE',
                        createdAt: new Date().toISOString()
                    };
                    persistSessionUser(sessionUser, response.token);
                    return { success: true, user: sessionUser };
                }
                return { success: false, error: 'Invalid login response from backend.' };
            } catch (e: any) {
                console.error("[Auth Context] Citizen login failed:", e);
                return { success: false, error: e.message || 'Login failed.' };
            }
        }

        return { success: false, error: 'Unknown portal mode' };
    };

    const signup = async (data: Omit<CitizenAccount, 'id' | 'role' | 'createdAt'>) => {
        console.log(`[Auth Context] Citizen signup attempt: ${data.email}`);
        
        // 1. Check if email is a reserved staff email pattern
        if (data.email.endsWith('@roadpulse.lk')) {
            return { success: false, error: 'Staff emails cannot be used for citizen registration.' };
        }

        const signupData = {
            name: data.name,
            email: data.email,
            password: data.passwordHash,
            role: 'CITIZEN'
        };

        const result = await authApi.signup(signupData);
        if (!result.success || !result.user || !result.token) {
            return { success: false, error: result.error || 'Registration failed at backend.' };
        }

        const sessionUser: User = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: 'CITIZEN',
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
        };

        persistSessionUser(sessionUser, result.token);
        console.log(`[Auth Context] Signup successful for ${data.email}. Session started.`);

        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(PROVINCE_KEY);
        localStorage.removeItem('roadpulse_token');
        sessionStorage.removeItem(PROVINCE_KEY);
    };

    const hasRole = (roles: UserRole[]) => {
        return user ? roles.includes(user.role) : false;
    };

    const getHomePath = (forcedRole?: UserRole): string => {
        const role = forcedRole || user?.role;
        if (!role) return '/citizen';

        switch (role) {
            case 'ADMIN': return '/admin/overview';
            case 'MAINTENANCE_OFFICER': return '/staff/overview';
            case 'CITIZEN': return '/citizen';
            default: return '/citizen';
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            signup,
            logout,
            isAuthenticated: !!user && !!localStorage.getItem('roadpulse_token'),
            hasRole,
            getHomePath
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
