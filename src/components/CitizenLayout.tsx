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
        <div className="min-h-screen bg-white font-sans text-slate-900">
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
                <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link to="/citizen" aria-label="RoadPulse Home" className="flex items-center gap-2 shrink-0 group">
                        <img src={logo} alt="RoadPulse Logo" className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
                        <span className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">RoadPulse</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                                    location.pathname === item.path
                                        ? "text-slate-900 bg-slate-100"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                                        <User size={13} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">
                                        {user.name?.split(' ')[0] || 'Me'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    aria-label="Sign out"
                                    title="Sign out"
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <LogOut size={17} />
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                state={{ from: location }}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                            >
                                <LogIn size={15} />
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        className="p-2 text-slate-900 md:hidden bg-slate-50 rounded-lg border border-slate-100"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white pt-16 px-4 md:hidden flex flex-col">
                    <nav className="flex flex-col gap-1 mt-4">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-colors",
                                    location.pathname === item.path
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-700 hover:bg-slate-50"
                                )}
                            >
                                <item.icon size={20} className={location.pathname === item.path ? "text-white" : "text-slate-400"} />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto mb-8 pt-6 border-t border-slate-100">
                        {isAuthenticated && user ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                        <p className="text-xs text-slate-400">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
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
                                className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white rounded-xl text-base font-semibold"
                            >
                                <LogIn size={18} />
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
                    <div className="bg-slate-50 border-t border-slate-100 py-16 px-4">
                        <div className="max-w-4xl mx-auto space-y-16">
                            {/* Steps */}
                            <section>
                                <h2 className="mb-10 text-center text-sm font-semibold text-slate-700">How it works</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        { step: "1", title: "Take a Photo", desc: "Snap a clear photo of the road damage from a safe location.", icon: PlusCircle },
                                        { step: "2", title: "Pin the Location", desc: "Use your GPS or tap the map to confirm exactly where the pothole is.", icon: Home },
                                        { step: "3", title: "We Handle the Rest", desc: "Our team reviews your report and dispatches a maintenance crew.", icon: CheckCircle },
                                    ].map((s, i) => (
                                        <div key={i} className="text-center space-y-3">
                                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-slate-900 relative">
                                                <s.icon size={22} />
                                                <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                                    {s.step}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                                            <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* FAQ */}
                            <section>
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                    <HelpCircle size={13} /> Frequently asked questions
                                </h2>
                                <div className="space-y-3">
                                    {FAQ_ITEMS.map((item, i) => (
                                        <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-1.5 flex items-center justify-between gap-4">
                                                {item.q}
                                                <ArrowRight size={13} className="text-slate-300 shrink-0" />
                                            </h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
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
