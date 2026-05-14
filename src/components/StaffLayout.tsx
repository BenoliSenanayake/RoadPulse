import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Bell,
    LayoutDashboard,
    LogOut,
    Map as MapIcon,
    Menu,
    Search,
    ShieldCheck,
    X,
    History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { BackendStatusBanner } from './BackendStatusBanner';

const staffNavItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/staff/overview' },
    { name: 'Live Map', icon: MapIcon, path: '/staff/map' },
    { name: 'Maintenance History', icon: History, path: '/staff/report-history' },
];

const StaffSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close staff navigation"
                    className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-100 bg-white transition-transform duration-200 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between border-b border-slate-50 px-5">
                    <Link to="/staff/overview" onClick={onClose} className="transition-opacity hover:opacity-80">
                        <Logo />
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-4 pt-6">
                    <div className="rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] p-4">
                        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[var(--accent-text)] shadow-sm">
                            <ShieldCheck size={18} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-text)] opacity-70">Field Operations</p>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-[var(--accent-text)]">Maintenance triage and repair management workspace.</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-8">
                    <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Navigation</p>
                    {staffNavItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                aria-label={`Open ${item.name}`}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon size={18} className={isActive ? "text-[var(--accent-text)]" : "text-slate-400"} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-50 bg-white p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/30 p-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-900">{user?.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Field Staff</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
};

const StaffHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open staff navigation"
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 lg:hidden"
                >
                    <Menu size={18} />
                </button>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RoadPulse Operations</p>
                    <h1 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Maintenance Console</h1>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden w-64 items-center md:flex group">
                    <Search className="absolute left-3 text-slate-400 group-focus-within:text-[var(--accent-solid)] transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search field records..."
                        className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-medium outline-none transition-all focus:border-[var(--accent-border)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-bg)]"
                    />
                </div>
                <button
                    type="button"
                    aria-label="View maintenance alerts"
                    className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                    <Bell size={18} />
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-slate-900 ring-2 ring-white" />
                </button>
            </div>
        </header>
    );
};

export const StaffLayout = ({ children }: { children: ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50/30 text-slate-900 theme-staff">
            <BackendStatusBanner />
            <StaffSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex min-h-screen flex-col lg:pl-72">
                <StaffHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};
