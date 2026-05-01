import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Menu, X, Home, Clock, PlusCircle, HelpCircle,
    CheckCircle, Shield, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import logo from '../assets/logo.png';

const FAQ_ITEMS = [
    { q: "How fast are potholes fixed?", a: "Once your report is AI-validated, it's dispatched to the local maintenance team. Fixes usually occur within 3-5 business days." },
    { q: "Is the AI validation accurate?", a: "Our system has a 98% accuracy rate in identifying road surface defects from photos." },
    { q: "Can I report multiple potholes?", a: "Yes, please submit a separate report for each unique location for better tracking." }
];

export const CitizenLayout = ({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout, getHomePath } = useAuth();
    const location = useLocation();

    const isStaff = user && ['ADMIN', 'MAINTENANCE_OFFICER'].includes(user.role);
    const unauthorized = location.state?.unauthorized;

    const navItems = [
        { name: 'Home', path: '/citizen', icon: Home },
        { name: 'Report Pothole', path: '/citizen/report', icon: PlusCircle },
        { name: 'My Reports', path: '/citizen/my-reports', icon: Clock },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {unauthorized && (
                <div className="bg-rose-600 text-white py-2 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                    Access Denied: You have been returned to the Citizen Portal.
                </div>
            )}
            {/* Public Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
                    <Link to="/citizen" aria-label="RoadPulse Home" className="flex items-center gap-2 group">
                        <img src={logo} alt="RoadPulse Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain group-hover:scale-110 transition-transform" />
                        <span className="text-lg sm:text-xl font-black tracking-tighter text-slate-900 uppercase">RoadPulse</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {isStaff && (
                            <Link
                                to={getHomePath()}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-slate-900/10"
                            >
                                Staff Dashboard
                            </Link>
                        )}
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "text-sm font-black uppercase tracking-widest transition-colors",
                                    location.pathname === item.path ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <button
                            onClick={logout}
                            aria-label="Sign out"
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                            <LogOutIcon />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        className="p-2 text-slate-900 md:hidden bg-slate-50 rounded-xl"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden">
                    <nav className="flex flex-col gap-6">
                        {isStaff && (
                            <Link
                                to={getHomePath()}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-4 text-2xl font-black text-slate-900 uppercase tracking-tighter"
                            >
                                <Shield size={28} className="text-primary" />
                                Staff Dashboard
                            </Link>
                        )}
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-4 text-2xl font-black text-slate-900 uppercase tracking-tighter"
                            >
                                <item.icon size={28} className="text-slate-300" />
                                {item.name}
                            </Link>
                        ))}
                        <hr className="border-slate-100" />
                        <button
                            onClick={logout}
                            className="flex items-center gap-4 text-2xl font-black text-rose-600 uppercase tracking-tighter"
                        >
                            <LogOutIcon />
                            Sign Out
                        </button>
                    </nav>
                </div>
            )}

            <main className="relative">
                {children}

                {/* FAQ & How it Works (Shown on main pages) */}
                {!hideFooter && (
                    <div className="bg-slate-50 py-20 px-4">
                        <div className="max-w-4xl mx-auto space-y-20">
                            {/* Steps */}
                            <section>
                                <h2 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-12">Reporting Protocol</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                    {[
                                        { step: "01", title: "Capture", desc: "Take a clear photo of the road damage using your phone.", icon: PlusCircle },
                                        { step: "02", title: "Verify", desc: "Our AI validates the damage and confirms the location.", icon: Shield },
                                        { step: "03", title: "Repair", desc: "Maintenance crews are dispatched to fix the issue.", icon: CheckCircle },
                                    ].map((s, i) => (
                                        <div key={i} className="text-center space-y-4">
                                            <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-slate-200 flex items-center justify-center mx-auto text-slate-900 relative border border-slate-100">
                                                <s.icon size={24} />
                                                <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white">
                                                    {s.step}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{s.title}</h3>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* FAQ */}
                            <section>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-3">
                                    <HelpCircle size={14} /> Knowledge Base
                                </h2>
                                <div className="space-y-4">
                                    {FAQ_ITEMS.map((item, i) => (
                                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                            <h4 className="font-black text-slate-900 mb-2 flex items-center justify-between gap-4">
                                                {item.q}
                                                <ArrowRight size={14} className="text-slate-300" />
                                            </h4>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.a}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100 md:hidden px-6 pb-8 pt-4 flex items-center justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <Link
                    to="/citizen"
                    aria-label="Public Dashboard"
                    className={cn(
                        "flex flex-col items-center gap-1",
                        location.pathname === '/citizen' ? "text-slate-900" : "text-slate-300"
                    )}
                >
                    <Home size={24} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
                </Link>
                <Link
                    to="/citizen/report"
                    aria-label="Report new pothole"
                    className="relative -top-10 bg-slate-900 text-white w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-slate-900/40 active:scale-95 transition-transform border-[6px] border-white"
                >
                    <PlusCircle size={28} />
                </Link>
                <Link
                    to="/citizen/my-reports"
                    aria-label="Submission history"
                    className={cn(
                        "flex flex-col items-center gap-1",
                        location.pathname === '/citizen/my-reports' ? "text-slate-900" : "text-slate-300"
                    )}
                >
                    <Clock size={24} />
                    <span className="text-[9px] font-black uppercase tracking-widest">History</span>
                </Link>
            </div>
        </div>
    );
};

const LogOutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
    </svg>
);
