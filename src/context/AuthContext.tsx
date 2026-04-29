import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { authApi } from '../lib/api';

export interface CitizenAccount extends User {
    passwordHash: string; // Simple hash/plain for prototype
    createdAt: string;
    phone?: string;
    district?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
    signup: (data: Omit<CitizenAccount, 'id' | 'role' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    continueAsGuest: () => void;
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

    const login = async (email: string, password?: string) => {
        // 1. Check Mock Staff Accounts (Admin/Officer)
        const staffUser = await authApi.verifyStaff(email);
        if (staffUser) {
            // In a real app, we'd check staff passwords too
            setUser(staffUser);
            localStorage.setItem(USER_KEY, JSON.stringify(staffUser));
            return { success: true };
        }

        // 2. Check Citizen Accounts
        const citizen = citizenAccounts.find(u => u.email === email);
        if (citizen) {
            // Simple credential check
            if (citizen.passwordHash === password) {
                const sessionUser: User = {
                    id: citizen.id,
                    name: citizen.name,
                    email: citizen.email,
                    role: 'CITIZEN'
                };
                setUser(sessionUser);
                localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
                return { success: true };
            }
            return { success: false, error: 'Invalid security key' };
        }

        return { success: false, error: 'Identity not found' };
    };

    const signup = async (data: Omit<CitizenAccount, 'id' | 'role' | 'createdAt'>) => {
        // Check if email taken
        const emailExists = await authApi.checkEmailExists(data.email);
        if (citizenAccounts.some(u => u.email === data.email) || emailExists) {
            return { success: false, error: 'Identity already registered' };
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
            role: 'CITIZEN'
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

    const continueAsGuest = () => {
        const guestUser: User = {
            id: `guest-${Date.now()}`,
            name: 'Guest Reporter',
            email: 'guest@roadpulse.lk',
            role: 'CITIZEN'
        };
        setUser(guestUser);
        localStorage.setItem(USER_KEY, JSON.stringify(guestUser));
    };

    const getHomePath = (forcedRole?: UserRole): string => {
        const role = forcedRole || user?.role;
        switch (role) {
            case 'ADMIN': return '/admin';
            case 'MAINTENANCE_OFFICER': return '/overview';
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
            continueAsGuest,
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
