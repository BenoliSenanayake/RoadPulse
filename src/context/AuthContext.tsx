import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { MOCK_USERS } from '../mockData';

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
        if (!saved) return null;

        const parsed = JSON.parse(saved) as User;
        if (parsed.id.startsWith('guest-') || parsed.email === 'guest@roadpulse.lk') {
            localStorage.removeItem(USER_KEY);
            return null;
        }

        return parsed;
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
        const normalizedEmail = email.trim().toLowerCase();

        const citizen = citizenAccounts.find(u => u.email.toLowerCase() === normalizedEmail);
        if (citizen) {
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

        const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === normalizedEmail);
        if (mockUser && password) {
            setUser(mockUser);
            localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
            return { success: true };
        }

        return { success: false, error: 'Identity not found' };
    };

    const signup = async (data: Omit<CitizenAccount, 'id' | 'role' | 'createdAt'>) => {
        const normalizedEmail = data.email.trim().toLowerCase();
        const emailExists = MOCK_USERS.some(u => u.email.toLowerCase() === normalizedEmail);
        if (citizenAccounts.some(u => u.email.toLowerCase() === normalizedEmail) || emailExists) {
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

    const getHomePath = (forcedRole?: UserRole): string => {
        const role = forcedRole || user?.role;
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
