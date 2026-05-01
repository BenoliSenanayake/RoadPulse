import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Bell,
    FileClock,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
    Shield,
    SlidersHorizontal,
    UserCog,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

const adminNavItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/admin/overview' },
    { name: 'Users', icon: UserCog, path: '/admin/users' },
    { name: 'Audit Logs', icon: FileClock, path: '/admin/audit-logs' },
    { name: 'System settings', icon: SlidersHorizontal, path: '/admin/settings' },
];

const AdminSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close admin navigation"
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl shadow-black/30 transition-transform duration-300 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
                    <Link to="/admin/overview" onClick={onClose} className="rounded-xl bg-white px-3 py-2 transition-opacity hover:opacity-90">
                        <Logo />
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-5 pt-6">
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
                            <Shield size={20} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Administrator</p>
                        <p className="mt-1 text-sm font-bold leading-snug text-white">Governance, access, audit, and system controls.</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
                    {adminNavItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                aria-label={`Open ${item.name}`}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black transition-all",
                                    isActive
                                        ? "bg-cyan-300 text-slate-950 shadow-xl shadow-cyan-300/20"
                                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <item.icon size={19} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-sm font-black uppercase text-slate-950">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-white">{user?.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200">System Admin</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-black text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
};

const AdminHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:h-20 sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open admin navigation"
                    className="rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
                >
                    <Menu size={20} />
                </button>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-700">RoadPulse Admin</p>
                    <h1 className="text-base font-black tracking-tight text-slate-950 sm:text-lg">Control Plane</h1>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden w-72 items-center md:flex">
                    <Search className="absolute left-3 text-slate-400" size={17} />
                    <input
                        type="text"
                        placeholder="Search users and logs"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-bold outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                    />
                </div>
                <Link
                    to="/admin/settings"
                    aria-label="Open system settings"
                    className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                    <Settings size={20} />
                </Link>
                <button
                    type="button"
                    aria-label="View admin notifications"
                    className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                    <Bell size={20} />
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white" />
                </button>
            </div>
        </header>
    );
};

export const AdminLayout = ({ children }: { children: ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-cyan-300 selection:text-slate-950">
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex min-h-screen flex-col lg:pl-72">
                <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};
