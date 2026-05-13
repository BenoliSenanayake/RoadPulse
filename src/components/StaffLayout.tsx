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
                "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-lg transition-transform duration-200 lg:translate-x-0 lg:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
                    <Link to="/staff/overview" onClick={onClose} className="transition-opacity hover:opacity-80">
                        <Logo />
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-4 pt-5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200">
                            <ShieldCheck size={20} />
                        </div>
                        <p className="text-xs font-medium text-slate-500">Maintenance officer</p>
                        <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">Field operations and repair triage workspace.</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
                    {staffNavItems.map((item) => {
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
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                )}
                            >
                                <item.icon size={19} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                            <p className="text-xs font-medium text-slate-500">Field staff</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-rose-600"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
};

const StaffHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open staff navigation"
                    className="rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
                >
                    <Menu size={20} />
                </button>
                <div>
                    <p className="text-xs font-medium text-slate-500">RoadPulse staff</p>
                    <h1 className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">Maintenance console</h1>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden w-72 items-center md:flex">
                    <Search className="absolute left-3 text-slate-400" size={17} />
                    <input
                        type="text"
                        placeholder="Search field records"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                    />
                </div>
                <button
                    type="button"
                    aria-label="View maintenance alerts"
                    className="relative rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                    <Bell size={20} />
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-slate-900 ring-2 ring-white" />
                </button>
            </div>
        </header>
    );
};

export const StaffLayout = ({ children }: { children: ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
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
