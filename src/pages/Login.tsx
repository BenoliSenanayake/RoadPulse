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
        <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
            {feedback && <Alert {...feedback} onClose={() => setFeedback(null)} />}

            <div className="relative z-10 flex w-full max-w-[400px] flex-col gap-7">
                {/* Brand Header */}
                <div className="flex flex-col items-center">
                    <div className={cn(
                        "mb-4 flex h-14 w-14 items-center justify-center rounded-xl border shadow-sm",
                        isAdmin ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
                    )}>
                        <img 
                            src={logo} 
                            alt="RP" 
                            className={cn(
                                "h-9 w-9 object-contain"
                            )} 
                        />
                    </div>
                    <div className="text-center">
                        <h1 className="mb-1 text-2xl font-bold leading-none tracking-tight text-[#0f172a]">RoadPulse</h1>
                        <p className="text-sm text-slate-500">{portalTitle}</p>
                    </div>
                </div>

                <div className="card-premium relative overflow-hidden p-7 sm:p-8">
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
                                    <span className="text-sm font-medium text-slate-500 transition-colors group-hover:text-slate-700">Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgot}
                                    className="text-sm font-medium text-slate-700 hover:text-slate-950"
                                >
                                    Forgot?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !isFormValid}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
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

                    {isCitizen && (
                        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                            <p className="text-sm text-slate-500">
                                New citizen? <Link to="/signup" state={{ from: location.state?.from }} className="mt-1 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-950 hover:underline underline-offset-4">
                                    <UserPlus size={14} /> Create Account
                                </Link>
                            </p>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                            <p className="text-sm font-medium text-slate-500">
                                Restricted Access Area
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
