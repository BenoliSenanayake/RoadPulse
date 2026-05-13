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
                "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white text-slate-900 shadow-lg transition-transform duration-200 lg:translate-x-0 lg:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Brand Logo */}
                <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
                    <Link to="/admin/overview" onClick={onClose} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                            <Shield size={19} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-semibold leading-none tracking-tight text-slate-950">RoadPulse</span>
                            <span className="mt-0.5 text-[11px] font-medium leading-none text-slate-500">Admin console</span>
                        </div>
                    </Link>
                    <button 
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 space-y-1 overflow-y-auto px-4 py-5 custom-scrollbar">
                    <p className="px-3 pb-2 text-xs font-medium text-slate-500">Navigation</p>
                    {adminNavItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} className={cn(isActive ? "text-white" : "text-slate-500 transition-colors")} />
                                    {item.name}
                                </div>
                                {isActive && <ChevronRight size={14} className="opacity-70" />}
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile & Logout */}
                <div className="mt-auto border-t border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="relative">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                                {user?.name?.charAt(0)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                            <p className="text-xs font-medium text-slate-500">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-rose-600"
                    >
                        <LogOut size={16} />
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
                    aria-label="Open Menu"
                >
                    <Menu size={20} />
                </button>
                <div className="hidden lg:block">
                    <h2 className="text-lg font-semibold leading-none tracking-tight text-slate-950">{currentItem.name}</h2>
                    <p className="mt-1 text-xs font-medium leading-none text-slate-500">Governance and oversight</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Search Bar - Desktop Only */}
                <div className="relative hidden xl:flex items-center group">
                    <Search className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search system records..." 
                        className="w-72 rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                    />
                </div>

                <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
                    <div className={cn("h-2 w-2 rounded-full", isBackendDown ? "bg-rose-500" : "bg-emerald-600")} />
                    <span className="text-xs font-medium text-slate-700">
                        {isBackendDown ? 'System issue' : 'System online'}
                    </span>
                </div>

                <button className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50">
                    <Bell size={19} />
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-slate-900 ring-2 ring-white" />
                </button>

                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50">
                    <Settings size={19} />
                </button>
            </div>
        </header>
    );
};

export const AdminLayout = ({ children }: { children: ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
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
