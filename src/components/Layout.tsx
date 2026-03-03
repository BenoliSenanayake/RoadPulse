import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Map as MapIcon,
    AlertTriangle,
    Wrench,
    Truck,
    Users,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
    const { user, logout, hasRole } = useAuth();
    const location = useLocation();

    const menuItems = [
        { name: 'Overview', icon: LayoutDashboard, path: '/overview', roles: ['ADMIN', 'MAINTENANCE_OFFICER'] },
        { name: 'Live Map', icon: MapIcon, path: '/map', roles: ['ADMIN', 'MAINTENANCE_OFFICER'] },
        { name: 'Potholes', icon: AlertTriangle, path: '/potholes', roles: ['ADMIN', 'MAINTENANCE_OFFICER'] },
        { name: 'Repairs', icon: Wrench, path: '/repairs', roles: ['ADMIN', 'MAINTENANCE_OFFICER'] },
        { name: 'Review Queue', icon: Truck, path: '/review-queue', roles: ['ADMIN', 'MAINTENANCE_OFFICER'] },
        { name: 'Admin', icon: Users, path: '/admin', roles: ['ADMIN'] },
        { name: 'Settings', icon: SettingsIcon, path: '/settings', roles: ['ADMIN'] },
    ];

    const filteredMenu = menuItems.filter(item => hasRole(item.roles as any));

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={toggle}
                />
            )}

            <aside className={cn(
                "fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 transition-transform duration-300 w-64 lg:translate-x-0 shadow-lg lg:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
                        <Link to="/" className="hover:opacity-80 transition-opacity">
                            <Logo />
                        </Link>
                        <button onClick={toggle} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
                        {filteredMenu.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    aria-label={`Navigate to ${item.name}`}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all hover-lift",
                                        isActive
                                            ? "bg-slate-900 text-white shadow-xl shadow-slate-900/40"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon size={20} className={isActive ? "text-white" : "text-slate-400"} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm uppercase">
                                {user?.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user?.role.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            aria-label="Sign out of the system"
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-[0.98]"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 sm:h-20 px-6 backdrop-blur-md bg-white/80 border-b border-border transition-all">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    aria-label="Toggle navigation menu"
                    className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="relative hidden md:flex items-center w-80 lg:w-96">
                    <Search className="absolute left-4 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search records..."
                        className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all font-medium"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <button
                    aria-label="View notifications"
                    className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <Bell size={20} />
                    <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
                </button>
            </div>
        </header>
    );
};

export const Layout = ({ children }: { children: ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-slate-900 selection:text-white">
            <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-col min-h-screen transition-all duration-300 lg:pl-64">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in-up">
                    {children}
                </main>
            </div>
        </div>
    );
};
