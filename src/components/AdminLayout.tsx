import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Bell,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    Shield,
    X,
    Search,
    FileText,
    Users,
    Activity,
    History,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { BackendStatusBanner } from './BackendStatusBanner';
import { isBackendDown } from '../lib/api';

const adminNavItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/admin/overview' },
    { name: 'All Reports', icon: FileText, path: '/admin/reports' },
    { name: 'Province Monitoring', icon: Activity, path: '/admin/provinces' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Audit Logs', icon: History, path: '/admin/audit-logs' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
];

const AdminSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-100 bg-white text-slate-900 transition-transform duration-200 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Brand Logo */}
                <div className="flex h-16 items-center justify-between border-b border-slate-50 px-5">
                    <Link to="/admin/overview" onClick={onClose} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
                            <Shield size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold leading-none tracking-tight text-slate-900">RoadPulse</span>
                            <span className="mt-1 text-[10px] font-medium leading-none text-slate-400 uppercase tracking-wider">Admin Console</span>
                        </div>
                    </Link>
                    <button 
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 space-y-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                    <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Navigation</p>
                    {adminNavItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} className={cn(isActive ? "text-[var(--accent-text)]" : "text-slate-400 transition-colors group-hover:text-slate-600")} />
                                    {item.name}
                                </div>
                                {isActive && <ChevronRight size={14} className="opacity-40" />}
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-auto border-t border-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/30 p-2.5">
                        <div className="relative">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                                {user?.name?.charAt(0)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-900">{user?.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">System Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                        <LogOut size={14} />
                        Sign out
                    </button>
                </div>
            </aside>
        </>
    );
};

const AdminHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
    const location = useLocation();
    const currentItem = adminNavItems.find(item => location.pathname.startsWith(item.path)) || adminNavItems[0];

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 md:px-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 text-slate-400 transition-colors hover:bg-slate-50 lg:hidden"
                    aria-label="Open Menu"
                >
                    <Menu size={18} />
                </button>
                <div className="hidden lg:block">
                    <h2 className="text-sm font-semibold leading-none tracking-tight text-slate-900">{currentItem.name}</h2>
                    <p className="mt-1 text-[10px] font-medium leading-none text-slate-400 uppercase tracking-wider">Governance Panel</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Search Bar - Desktop Only */}
                <div className="relative hidden xl:flex items-center group">
                    <Search className="absolute left-3 text-slate-400 group-focus-within:text-[var(--accent-solid)] transition-colors" size={13} />
                    <input 
                        type="text" 
                        placeholder="Search system records..." 
                        className="w-64 rounded-lg border border-slate-100 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-[var(--accent-border)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-bg)]"
                    />
                </div>

                <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3">
                    <div className={cn("h-1.5 w-1.5 rounded-full", isBackendDown ? "bg-rose-500" : "bg-[var(--accent-solid)]")} />
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {isBackendDown ? 'System Issue' : 'System Online'}
                    </span>
                </div>

                <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400 transition-colors hover:bg-slate-50">
                    <Bell size={17} />
                    <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-slate-900 ring-2 ring-white" />
                </button>

                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400 transition-colors hover:bg-slate-50">
                    <Settings size={17} />
                </button>
            </div>
        </header>
    );
};

export const AdminLayout = ({ children }: { children: ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50/30 theme-admin">
            <BackendStatusBanner />
            <div className="flex flex-1">
                <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                
                <div className="flex flex-1 flex-col lg:pl-72">
                    <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
                    
                    <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
