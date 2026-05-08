import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Alert, type AlertType } from '../components/Alert';
import { AuthInput } from '../components/AuthInput';
import type { UserRole } from '../types';
import logo from '../assets/logo.png';

const LoginPage = () => {
    const [email, setEmail] = useState(() => localStorage.getItem('rp_remember_email') || '');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rp_remember_email'));
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [feedback, setFeedback] = useState<{ type: AlertType; message: string; description?: string } | null>(null);

    const { login, isAuthenticated, user, getHomePath } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const fromLocation = location.state?.from as { pathname?: string; search?: string } | undefined;
    const returnTo = new URLSearchParams(location.search).get('returnTo');
    const stateFrom = fromLocation?.pathname
        ? `${fromLocation.pathname}${fromLocation.search ?? ''}`
        : '/citizen';
    const intendedPath = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
        ? returnTo
        : stateFrom;

    const getRedirectTarget = useCallback((role?: UserRole) => {
        const activeRole = role || user?.role;
        const fallback = getHomePath(activeRole);

        if (!intendedPath || intendedPath.startsWith('/login') || intendedPath === '/') {
            return fallback;
        }

        // CITIZEN Firewall: Never allow a citizen to be redirected to staff/admin areas
        if (activeRole === 'CITIZEN') {
            const isRestrictedPath = intendedPath.startsWith('/staff') || 
                                   intendedPath.startsWith('/admin') || 
                                   intendedPath.startsWith('/potholes');
            return isRestrictedPath ? '/citizen' : intendedPath;
        }

        // STAFF/ADMIN Firewall: Ensure they go to their intended area or fallback to their home
        if (activeRole === 'MAINTENANCE_OFFICER') {
            return (intendedPath.startsWith('/staff') || intendedPath.startsWith('/potholes'))
                ? intendedPath
                : getHomePath('MAINTENANCE_OFFICER');
        }

        if (activeRole === 'ADMIN') {
            return (intendedPath.startsWith('/admin') || intendedPath.startsWith('/staff'))
                ? intendedPath
                : getHomePath('ADMIN');
        }

        return intendedPath;
    }, [getHomePath, intendedPath, user?.role]);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(getRedirectTarget(user?.role), { replace: true });
        }
    }, [getRedirectTarget, isAuthenticated, navigate, user?.role]);

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Enter a valid email address";
        }
        if (password.length < 1) {
            newErrors.password = "Password required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        if (rememberMe) {
            localStorage.setItem('rp_remember_email', email);
        } else {
            localStorage.removeItem('rp_remember_email');
        }

        await new Promise(r => setTimeout(r, 1200));

        const result = await login(email, password);
        setIsLoading(false);

        if (result.success) {
            navigate(getRedirectTarget(result.user?.role), { replace: true });
        } else {
            setFeedback({
                type: 'error',
                message: 'Sign in failed',
                description: result.error || 'Invalid credentials provided.'
            });
            setErrors({ password: 'Check your password' });
        }
    };

    const handleForgot = () => {
        setFeedback({
            type: 'info',
            message: 'Password recovery',
            description: 'A reset link has been sent to your email address.'
        });
    };

    const isFormValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length > 0;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 relative overflow-hidden">
            {feedback && <Alert {...feedback} onClose={() => setFeedback(null)} />}

            {/* Premium Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#f1f5f9_0%,transparent_100%)]" />
                <div className="absolute inset-0 opacity-[0.03] grayscale bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-slate-900/[0.02] rounded-full blur-3xl" />
            </div>

            <div className="max-w-[400px] w-full relative z-10 flex flex-col gap-8">
                {/* Brand Header */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-premium border border-slate-100 flex items-center justify-center mb-4 group hover:scale-105 transition-all duration-500">
                        <img src={logo} alt="RP" className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">RoadPulse</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Citizen Sign In</p>
                    </div>
                </div>

                <div className="card-premium p-8 sm:p-10 border-none shadow-2xl shadow-slate-900/10 relative overflow-hidden">
                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <AuthInput
                            label="Email"
                            type="email"
                            placeholder="Email address"
                            icon={<Mail />}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            error={errors.email}
                            required
                        />

                        <div className="space-y-5">
                            <AuthInput
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                icon={<Lock />}
                                showPasswordToggle
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors({ ...errors, password: '' });
                                }}
                                error={errors.password}
                                required
                            />

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-4 h-4 border-2 border-slate-200 rounded peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-all" />
                                        <CheckIcon className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform left-0.5" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Remember Me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgot}
                                    className="text-[10px] font-black text-slate-900 uppercase tracking-widest hover:underline decoration-slate-900/20"
                                >
                                    Forgot?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !isFormValid}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3 mt-2"
                        >
                            {isLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    Sign In <LogIn size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <p className="text-[11px] font-bold text-slate-400">
                            New Citizen? <Link to="/signup" state={{ from: location.state?.from }} className="text-slate-900 font-black hover:underline underline-offset-4 flex items-center justify-center gap-1.5 mt-1 text-xs uppercase tracking-widest">
                                <UserPlus size={14} /> Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default LoginPage;
