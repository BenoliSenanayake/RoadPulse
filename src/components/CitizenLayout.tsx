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
        { name: 'HOME', path: '/citizen', icon: Home },
        { name: 'REPORT A POTHOLE', path: '/citizen/report', icon: PlusCircle },
        { name: 'MY REPORTS', path: '/citizen/my-reports', icon: Clock },
    ];

    const handleSignOut = () => {
        logout();
        navigate('/citizen');
        setIsMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#F7F9FC] font-sans text-[#0F172A] theme-citizen">
            <header className="sticky top-0 z-50 border-b border-[#DCE3EE] bg-white/90 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
                    {/* Logo */}
                    <Link to="/citizen" aria-label="RoadPulse Home" className="flex items-center gap-3 shrink-0 group">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#DCE3EE] flex items-center justify-center shadow-sm group-hover:border-[#4F6FAF] transition-all">
                            <img src={logo} alt="" className="h-6 w-6 object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-[#0F172A]">RoadPulse</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-2">
                        {navItems.map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest transition-all",
                                        isActive
                                            ? "text-[#4F6FAF] bg-[#F7F9FC] border border-[#DCE3EE]"
                                            : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F7F9FC]"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-6 shrink-0">
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 rounded-xl bg-[#0F172A] px-5 py-2.5 shadow-md">
                                    <div className="w-6 h-6 rounded-lg bg-[#1E293B] flex items-center justify-center text-white">
                                        <User size={14} />
                                    </div>
                                    <span className="text-[11px] font-bold text-white tracking-widest uppercase">
                                        {user.name?.split(' ')[0] || 'TEST'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="p-2 text-[#64748B] hover:text-[#0F172A] transition-colors"
                                    title="Sign out"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                state={{ from: location }}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#4F6FAF] px-8 py-3 text-sm font-bold text-white transition-all hover:bg-[#3E5C96] shadow-sm hover:shadow-md"
                            >
                                <LogIn size={18} /> Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-[#64748B] lg:hidden hover:text-[#0F172A]"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-[#F7F9FC] pt-20 px-6 md:hidden flex flex-col">
                    <nav className="flex flex-col gap-2">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 px-6 py-4 rounded-xl text-base font-bold transition-all",
                                    location.pathname === item.path
                                        ? "bg-white text-[#4F6FAF] border border-[#DCE3EE] shadow-sm"
                                        : "text-[#64748B] hover:bg-white hover:text-[#0F172A]"
                                )}
                            >
                                <item.icon size={20} className={location.pathname === item.path ? "text-[#4F6FAF]" : "text-[#94A3B8]"} />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto mb-10 pt-8 border-t border-[#DCE3EE]">
                        {isAuthenticated && user ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 px-6 py-4 bg-white rounded-xl border border-[#DCE3EE] shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-[#EAF2FF] flex items-center justify-center text-[#4F6FAF]">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-[#0F172A]">{user.name}</p>
                                        <p className="text-xs text-[#64748B]">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-base font-bold text-rose-600 transition-colors hover:bg-rose-50"
                                >
                                    <LogOut size={22} />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                state={{ from: location }}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-[#4F6FAF] text-white rounded-xl text-base font-bold shadow-sm"
                            >
                                <LogIn size={20} />
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
                    <div className="bg-white border-t border-[#DCE3EE] py-24 px-6">
                        <div className="max-w-5xl mx-auto space-y-24">
                            {/* Steps */}
                            <section>
                                <div className="text-center mb-16">
                                    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4F6FAF] mb-3">Service Workflow</h2>
                                    <h3 className="text-3xl font-bold text-[#0F172A]">How we process your reports</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                    {[
                                        { step: "01", title: "Document", desc: "Capture clear imagery of the road hazard from a safe distance.", icon: PlusCircle },
                                        { step: "02", title: "Locate", desc: "Pinpoint the precise coordinates to assist maintenance crews.", icon: Home },
                                        { step: "03", title: "Resolve", desc: "Our teams prioritize and schedule repairs based on severity.", icon: CheckCircle },
                                    ].map((s, i) => (
                                        <div key={i} className="text-center group">
                                            <div className="w-16 h-16 bg-[#EAF2FF] rounded-2xl flex items-center justify-center mx-auto text-[#4F6FAF] relative mb-6 transition-transform group-hover:scale-105">
                                                <s.icon size={28} />
                                                <span className="absolute -top-2 -right-2 bg-[#4F6FAF] text-white text-[10px] font-bold w-7 h-7 rounded-lg flex items-center justify-center shadow-md">
                                                    {s.step}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-[#0F172A] mb-3">{s.title}</h4>
                                                <p className="text-sm text-[#64748B] leading-relaxed">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* FAQ */}
                            <section>
                                <div className="text-center mb-12">
                                    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4F6FAF] mb-3">Support</h2>
                                    <h3 className="text-3xl font-bold text-[#0F172A]">Common Questions</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {FAQ_ITEMS.map((item, i) => (
                                        <div key={i} className="bg-[#F7F9FC] p-8 rounded-2xl border border-[#DCE3EE] transition-all hover:bg-white hover:shadow-md hover:border-[#4F6FAF]">
                                            <h4 className="text-base font-bold text-[#0F172A] mb-3">
                                                {item.q}
                                            </h4>
                                            <p className="text-sm text-[#64748B] leading-relaxed">{item.a}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Minimal Bottom Footer */}
                            <div className="pt-12 border-t border-[#DCE3EE] flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-semibold text-[#64748B] uppercase tracking-widest">
                                <p>© 2024 RoadPulse Infrastructure Sri Lanka</p>
                                <div className="flex items-center gap-8">
                                    <Link to="#" className="hover:text-[#4F6FAF]">Privacy Policy</Link>
                                    <Link to="#" className="hover:text-[#4F6FAF]">Terms of Service</Link>
                                    <Link to="#" className="hover:text-[#4F6FAF]">Help Center</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
