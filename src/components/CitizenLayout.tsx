import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Menu, X, Home, Clock, PlusCircle, HelpCircle,
    CheckCircle, ArrowRight, LogOut, User, LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import logo from '../assets/logo.png';

const FAQ_ITEMS = [
    { q: "How fast are potholes fixed?", a: "Once your report is submitted, it's reviewed by our team and dispatched to the local maintenance crew. Fixes usually occur within 3-5 business days." },
    { q: "How will I know when my report is acted on?", a: "You can track the status of all your reports from the 'My Reports' page after logging in." },
    { q: "Can I report multiple potholes?", a: "Yes! Please submit a separate report for each location so our team can track and fix them individually." },
];

export const CitizenLayout = ({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { name: 'Home', path: '/citizen', icon: Home },
        { name: 'Report a Pothole', path: '/citizen/report', icon: PlusCircle },
        { name: 'My Reports', path: '/citizen/my-reports', icon: Clock },
    ];

    const handleSignOut = () => {
        logout();
        navigate('/citizen');
        setIsMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 theme-citizen">
            <header className="sticky top-0 z-50 border-b border-slate-50 bg-white">
                <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link to="/citizen" aria-label="RoadPulse Home" className="flex items-center gap-2 shrink-0">
                        <img src={logo} alt="RoadPulse Logo" className="h-6 w-6 object-contain sm:h-7 sm:w-7" />
                        <span className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">RoadPulse</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                                    location.pathname === item.path
                                        ? "text-slate-950 bg-slate-50 border border-slate-100"
                                        : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                        {isAuthenticated && user ? (
                            <>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-1.5">
                                    <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center text-white">
                                        <User size={12} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                        {user.name?.split(' ')[0] || 'Me'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    aria-label="Sign out"
                                    title="Sign out"
                                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                    <LogOut size={16} />
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                state={{ from: location }}
                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        className="p-2 text-slate-400 md:hidden hover:text-slate-900"
                    >
                        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white pt-16 px-4 md:hidden flex flex-col">
                    <nav className="flex flex-col gap-1 mt-8">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors",
                                    location.pathname === item.path
                                        ? "bg-slate-50 text-slate-900 border border-slate-100"
                                        : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <item.icon size={18} className={location.pathname === item.path ? "text-slate-900" : "text-slate-400"} />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto mb-8 pt-6 border-t border-slate-50">
                        {isAuthenticated && user ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-rose-600 transition-colors"
                                >
                                    <LogOut size={20} />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                state={{ from: location }}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest"
                            >
                                <LogIn size={16} />
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <main className="relative">
                {children}

                {/* Footer */}
                {!hideFooter && (
                    <div className="bg-white border-t border-slate-50 py-20 px-4">
                        <div className="max-w-4xl mx-auto space-y-20">
                            {/* Steps */}
                            <section>
                                <h2 className="mb-12 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Reporting Process</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                    {[
                                        { step: "01", title: "Document", desc: "Capture clear imagery of the hazard from a safe distance.", icon: PlusCircle },
                                        { step: "02", title: "Locate", desc: "Pinpoint the precise coordinates to assist maintenance crews.", icon: Home },
                                        { step: "03", title: "Resolve", desc: "Our teams prioritize and schedule repairs based on severity.", icon: CheckCircle },
                                    ].map((s, i) => (
                                        <div key={i} className="text-center space-y-5">
                                            <div className="w-14 h-14 bg-[var(--accent-bg)] rounded-2xl flex items-center justify-center mx-auto text-[var(--accent-text)] relative">
                                                <s.icon size={22} />
                                                <span className="absolute -top-2 -right-2 bg-white text-slate-900 text-[9px] font-bold w-6 h-6 rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
                                                    {s.step}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{s.title}</h3>
                                                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed px-4">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* FAQ */}
                            <section>
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center justify-center gap-2">
                                    Frequently asked questions
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {FAQ_ITEMS.map((item, i) => (
                                        <div key={i} className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 transition-colors hover:border-[var(--accent-border)] hover:bg-white">
                                            <h4 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
                                                {item.q}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 leading-relaxed">{item.a}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
