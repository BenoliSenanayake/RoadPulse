import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole, ProvincialCouncil } from '../types';
import { authApi } from '../lib/api';

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
const CITIZEN_ACCOUNTS_KEY = 'rp_citizen_accounts';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // Current Session
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem(USER_KEY);
        return saved ? JSON.parse(saved) : null;
    });

    // Persistent Accounts
    const [citizenAccounts, setCitizenAccounts] = useState<CitizenAccount[]>(() => {
        const saved = localStorage.getItem(CITIZEN_ACCOUNTS_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    // Keep localStorage in sync with accounts state
    useEffect(() => {
        localStorage.setItem(CITIZEN_ACCOUNTS_KEY, JSON.stringify(citizenAccounts));
    }, [citizenAccounts]);

    const login = async (email: string, password?: string, provincialCouncil?: ProvincialCouncil) => {
        // Staff/admin login is only allowed from the staff login flow.
        if (provincialCouncil) {
            const staffUser = await authApi.verifyStaff(email);
            if (!staffUser) {
                return { success: false, error: 'Staff account not found or unauthorized for this province.' };
            }

            const sessionUser: User = {
                ...staffUser,
                provincialCouncil: staffUser.role === 'MAINTENANCE_OFFICER' ? provincialCouncil : undefined,
            };
            setUser(sessionUser);
            localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
            return { success: true, user: sessionUser };
        }

        // Citizen login never checks or creates a staff/admin session.
        const citizen = citizenAccounts.find(u => u.email === email);
        if (citizen) {
            // Simple credential check
            if (citizen.passwordHash === password) {
                const sessionUser: User = {
                    id: citizen.id,
                    name: citizen.name,
                    email: citizen.email,
                    role: 'CITIZEN',
                    status: 'ACTIVE',
                    createdAt: new Date().toISOString()
                };
                setUser(sessionUser);
                localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
                return { success: true, user: sessionUser };
            }
            return { success: false, error: 'Invalid password' };
        }

        return { success: false, error: 'Account not found' };
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

        const newCitizen: CitizenAccount = {
            ...data,
            id: `cit-${Date.now()}`,
            role: 'CITIZEN',
            createdAt: new Date().toISOString()
        };

        setCitizenAccounts(prev => [...prev, newCitizen]);

        // Auto-login
        const sessionUser: User = {
            id: newCitizen.id,
            name: newCitizen.name,
            email: newCitizen.email,
            role: 'CITIZEN',
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
        };
        setUser(sessionUser);
        localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));

        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(USER_KEY);
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
