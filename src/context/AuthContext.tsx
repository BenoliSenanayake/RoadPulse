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
const CITIZEN_ACCOUNTS_KEY = 'rp_citizen_accounts';

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

    // Persistent Accounts
    const [citizenAccounts, setCitizenAccounts] = useState<CitizenAccount[]>(() => {
        try {
            const saved = localStorage.getItem(CITIZEN_ACCOUNTS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("[Auth] Failed to parse accounts from storage", e);
            localStorage.removeItem(CITIZEN_ACCOUNTS_KEY);
            return [];
        }
    });

    // Keep localStorage in sync with accounts state
    useEffect(() => {
        localStorage.setItem(CITIZEN_ACCOUNTS_KEY, JSON.stringify(citizenAccounts));
    }, [citizenAccounts]);

    const persistSessionUser = (sessionUser: User, token?: string) => {
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
                // Try backend login first to get JWT
                const response = await authApi.login(email, password);
                if (response && response.user && response.user.role === 'CITIZEN') {
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
            } catch (e) {
                console.warn("[Auth] Backend login failed for citizen, checking local accounts", e);
            }

            // Fallback to local accounts for prototype compatibility
            const citizen = citizenAccounts.find(u => u.email === email);
            if (citizen) {
                if (citizen.passwordHash === password) {
                    const sessionUser: User = {
                        id: citizen.id,
                        name: citizen.name,
                        email: citizen.email,
                        role: 'CITIZEN',
                        status: 'ACTIVE',
                        createdAt: new Date().toISOString()
                    };
                    persistSessionUser(sessionUser);
                    return { success: true, user: sessionUser };
                }
                return { success: false, error: 'Invalid password' };
            }
            return { success: false, error: 'Account not found' };
        }

        return { success: false, error: 'Unknown portal mode' };
    };

    const signup = async (data: Omit<CitizenAccount, 'id' | 'role' | 'createdAt'>) => {
        // 1. Check if email is a reserved staff email pattern
        if (data.email.endsWith('@roadpulse.lk')) {
            return { success: false, error: 'Staff emails cannot be used for citizen registration.' };
        }

        // 2. Check if email already taken in mock staff or existing accounts
        const emailExists = await authApi.checkEmailExists(data.email);
        if (citizenAccounts.some(u => u.email === data.email) || emailExists) {
            return { success: false, error: 'Email identity already registered in the network.' };
        }

        const signupData = {
            name: data.name,
            email: data.email,
            password: data.passwordHash, // Backend expects 'password'
            role: 'CITIZEN'
        };

        const result = await authApi.signup(signupData);
        if (!result.success) {
            return { success: false, error: 'Registration failed at backend.' };
        }

        // Use the ID returned directly from signup; fall back to listUsers() if missing.
        let backendUserId: string | undefined = result.userId;
        if (!backendUserId) {
            const response = await authApi.listUsers({ search: data.email });
            backendUserId = response.data?.find((u: any) => u.email === data.email)?.id;
        }

        const newCitizen: CitizenAccount = {
            ...data,
            id: backendUserId || `cit-${Date.now()}`,
            role: 'CITIZEN',
            createdAt: new Date().toISOString()
        };

        setCitizenAccounts(prev => [...prev, newCitizen]);

        // Auto-login (Backend signup doesn't return token usually, so we might need to login or handle it)
        const sessionUser: User = {
            id: newCitizen.id,
            name: newCitizen.name,
            email: newCitizen.email,
            role: 'CITIZEN',
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
        };
        persistSessionUser(sessionUser);

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
            isAuthenticated: !!user,
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
