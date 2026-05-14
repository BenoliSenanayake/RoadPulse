import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Alert, type AlertType } from '../components/Alert';
import { AuthInput } from '../components/AuthInput';
import type { UserRole } from '../types';
import logo from '../assets/logo.png';
import { cn } from '../lib/utils';

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

        if (activeRole === 'CITIZEN') {
            const isRestrictedPath = intendedPath.startsWith('/staff') || 
                                   intendedPath.startsWith('/admin') || 
                                   intendedPath.startsWith('/potholes');
            return isRestrictedPath ? '/citizen' : intendedPath;
        }

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

    const portalMode = import.meta.env.VITE_PORTAL_MODE || 'citizen';
    const isCitizen = portalMode === 'citizen';
    const isAdmin = portalMode === 'admin';
    const portalTitle = isAdmin ? 'Admin Sign In' : 'Citizen Sign In';

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
        <div className={cn(
            "relative flex min-h-screen items-center justify-center px-4 py-8",
            isCitizen ? "bg-[#F7F9FC] theme-citizen" : "bg-slate-50"
        )}>
            {feedback && <Alert {...feedback} onClose={() => setFeedback(null)} />}

            <div className="relative z-10 flex w-full max-w-[400px] flex-col gap-10">
                {/* Brand Header */}
                <div className="flex flex-col items-center">
                    <div className={cn(
                        "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-md transition-all",
                        isAdmin 
                            ? "border-slate-800 bg-slate-900" 
                            : "border-[#DCE3EE] bg-white hover:border-[#4F6FAF] hover:shadow-lg"
                    )}>
                        <img 
                            src={logo} 
                            alt="RP" 
                            className="h-10 w-10 object-contain" 
                        />
                    </div>
                    <div className="text-center space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">RoadPulse</h1>
                        <p className={cn(
                            "text-sm font-bold uppercase tracking-[0.2em]",
                            isCitizen ? "text-[#4F6FAF]" : "text-slate-500"
                        )}>{portalTitle}</p>
                    </div>
                </div>

                <div className={cn(
                    "card-premium relative overflow-hidden p-8 sm:p-10",
                    isCitizen ? "bg-white border-[#DCE3EE] shadow-2xl" : ""
                )}>
                    {isCitizen && <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4F6FAF]" />}
                    
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <AuthInput
                            label="Email"
                            type="email"
                            placeholder="e.g. citizen@example.gov"
                            icon={<Mail className="text-[#94A3B8]" />}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            error={errors.email}
                            required
                        />

                        <div className="space-y-6">
                            <AuthInput
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                icon={<Lock className="text-[#94A3B8]" />}
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
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className={cn(
                                            "w-5 h-5 border-2 rounded-lg transition-all",
                                            isCitizen 
                                                ? "border-[#DCE3EE] peer-checked:bg-[#4F6FAF] peer-checked:border-[#4F6FAF]"
                                                : "border-slate-200 peer-checked:bg-slate-900 peer-checked:border-slate-900"
                                        )} />
                                        <CheckIcon className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform left-[3px]" />
                                    </div>
                                    <span className="text-sm font-bold text-[#64748B] transition-colors group-hover:text-[#0F172A]">Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgot}
                                    className={cn(
                                        "text-sm font-bold transition-colors",
                                        isCitizen ? "text-[#4F6FAF] hover:text-[#0F172A]" : "text-slate-700 hover:text-slate-950"
                                    )}
                                >
                                    Forgot?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !isFormValid}
                            className={cn(
                                "mt-4 flex w-full items-center justify-center gap-3 py-4 rounded-xl text-base font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50",
                                isCitizen 
                                    ? "bg-[#4F6FAF] text-white hover:bg-[#3E5C96] hover:shadow-xl" 
                                    : "bg-slate-900 text-white hover:bg-slate-800"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    Sign In <LogIn size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {isCitizen && (
                        <div className="mt-10 pt-8 border-t border-[#F1F5F9] text-center">
                            <p className="text-sm font-bold text-[#64748B]">
                                New to RoadPulse? <Link to="/signup" state={{ from: location.state?.from }} className="mt-2 flex items-center justify-center gap-2 text-sm font-extrabold text-[#0F172A] hover:text-[#4F6FAF] transition-colors">
                                    <UserPlus size={18} /> Create Regional Account
                                </Link>
                            </p>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                Restricted Access Console
                            </p>
                        </div>
                    )}
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
