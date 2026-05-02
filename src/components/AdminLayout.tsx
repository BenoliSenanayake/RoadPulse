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
    FileClock,
    UserCog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const adminNavItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/admin/overview' },
    { name: 'All Reports', icon: FileClock, path: '/admin/reports' },
    { name: 'Province Monitoring', icon: Search, path: '/admin/provinces' },
    { name: 'Users', icon: UserCog, path: '/admin/users' },
    { name: 'Audit Logs', icon: FileClock, path: '/admin/audit-logs' },
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
                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-[#020617] text-white transition-all duration-300 ease-in-out lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Brand Logo */}
                <div className="flex h-20 items-center justify-between px-6 border-b border-white/5">
                    <Link to="/admin/overview" onClick={onClose} className="flex items-center gap-3 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                            <Shield className="text-white" size={22} fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tighter text-white uppercase leading-none">RoadPulse</span>
                            <span className="text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase leading-none mt-1">Command Center</span>
                        </div>
                    </Link>
                    <button 
                        onClick={onClose}
                        className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-4 py-8 space-y-2">
                    <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Main Menu</p>
                    {adminNavItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
                                    {item.name}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile & Logout */}
                <div className="mt-auto border-t border-white/5 p-6 bg-white/[0.02]">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="relative">
                            <div className="h-10 w-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-blue-400 text-lg shadow-inner">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#020617]" title="Online" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate">{user?.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20"
                    >
                        <LogOut size={18} />
                        Terminate Session
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
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl md:px-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
                    aria-label="Open Menu"
                >
                    <Menu size={20} />
                </button>
                <div className="hidden lg:block">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{currentItem.name}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-1.5">Governance & Oversight</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Search Bar - Desktop Only */}
                <div className="relative hidden xl:flex items-center">
                    <Search className="absolute left-3.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search system records..." 
                        className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5"
                    />
                </div>

                <div className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sys OK</span>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

                <button className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-all">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                </button>

                <Link 
                    to="/admin/settings" 
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-all"
                >
                    <Settings size={20} />
                </Link>
            </div>
        </header>
    );
};

export const AdminLayout = ({ children }: { children: ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex selection:bg-blue-600 selection:text-white">
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
                <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 md:p-8">
                    {/* Content wrapper with max-width for better readability on large screens */}
                    <div className="mx-auto w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
