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

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
    const { user, logout, hasRole } = useAuth();
    const location = useLocation();

    const menuItems = [
        { name: 'Overview', icon: LayoutDashboard, path: '/overview', roles: ['ADMIN', 'MAINTENANCE_OFFICER'] },
        { name: 'Live Map', icon: MapIcon, path: '/map', roles: ['ADMIN', 'MAINTENANCE_OFFICER'] },
        { name: 'Potholes', icon: AlertTriangle, path: '/potholes', roles: ['ADMIN', 'MAINTENANCE_OFFICER'] },
        { name: 'Repairs', icon: Wrench, path: '/repairs', roles: ['ADMIN', 'MAINTENANCE_OFFICER'] },
        { name: 'Review Queue', icon: Truck, path: '/review-queue', roles: ['ADMIN', 'MAINTENANCE_OFFICER'] },
        { name: 'Submit Report', icon: AlertTriangle, path: '/report', roles: ['CITIZEN'] },
        { name: 'Admin', icon: Users, path: '/admin', roles: ['ADMIN'] },
        { name: 'Settings', icon: SettingsIcon, path: '/settings', roles: ['ADMIN'] },
    ];

    const filteredMenu = menuItems.filter(item => hasRole(item.roles as any));

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={toggle}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-screen bg-white border-r border-border transition-transform duration-300 w-64 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            </div>
                            <span className="text-xl font-bold text-text tracking-tight">RoadPulse</span>
                        </Link>
                        <button onClick={toggle} className="lg:hidden p-1 text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {filteredMenu.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    location.pathname.startsWith(item.path)
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-600 hover:bg-gray-100"
                                )}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3 px-3 py-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs">
                                {user?.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text truncate">{user?.name}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user?.role.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={20} />
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
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Menu size={20} />
                </button>
                <div className="relative hidden md:block w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search potholes, runs, or users..."
                        className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>
            </div>
        </header>
    );
};

export const Layout = ({ children }: { children: ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};
