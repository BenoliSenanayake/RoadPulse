import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { MOCK_USERS } from '../mockData';

interface AuthContextType {
    user: User | null;
    login: (email: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('rp_user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (email: string) => {
        const foundUser = MOCK_USERS.find(u => u.email === email);
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('rp_user', JSON.stringify(foundUser));
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('rp_user');
    };

    const hasRole = (roles: UserRole[]) => {
        return user ? roles.includes(user.role) : false;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasRole }}>
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
