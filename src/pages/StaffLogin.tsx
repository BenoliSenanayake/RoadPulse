import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, Loader2, MapPin } from 'lucide-react';
import { AuthInput } from '../components/AuthInput';
import { Alert, type AlertType } from '../components/Alert';
import { PROVINCIAL_COUNCILS, type ProvincialCouncil } from '../types';
import type { UserRole } from '../types';
import logo from '../assets/logo.png';

const StaffLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedProvince, setSelectedProvince] = useState<ProvincialCouncil | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; province?: string }>({});
    const [feedback, setFeedback] = useState<{ type: AlertType; message: string; description?: string } | null>(null);

    const { login, isAuthenticated, user, getHomePath } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const fromLocation = location.state?.from as { pathname?: string; search?: string } | undefined;
    const intendedPath = fromLocation?.pathname
        ? `${fromLocation.pathname}${fromLocation.search ?? ''}`
        : '';

    const getStaffRedirectTarget = useCallback((role?: UserRole) => {
        if (role === 'ADMIN') {
            return intendedPath.startsWith('/admin') ? intendedPath : getHomePath('ADMIN');
        }
        if (role === 'MAINTENANCE_OFFICER') {
            return intendedPath.startsWith('/staff') || intendedPath.startsWith('/potholes')
                ? intendedPath
                : getHomePath('MAINTENANCE_OFFICER');
        }
        return getHomePath(role);
    }, [getHomePath, intendedPath]);

    useEffect(() => {
        if (isAuthenticated && user?.role !== 'CITIZEN') {
            navigate(getStaffRedirectTarget(user?.role), { replace: true });
        }
    }, [getStaffRedirectTarget, isAuthenticated, navigate, user?.role]);

    const validate = () => {
        const newErrors: { email?: string; password?: string; province?: string } = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Enter a valid staff email";
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
        await new Promise(r => setTimeout(r, 1200));

        const result = await login(email, password, selectedProvince || undefined);
        setIsLoading(false);

        if (result.success) {
            navigate(getStaffRedirectTarget(result.user?.role), { replace: true });
        } else {
            setFeedback({
                type: 'error',
                message: 'Access Denied',
                description: result.error || 'Invalid credentials. Contact your administrator.'
            });
            setErrors({ password: 'Check your credentials' });
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
            {feedback && <Alert {...feedback} onClose={() => setFeedback(null)} />}

            <div className="relative z-10 flex w-full max-w-[420px] flex-col gap-7">
                {/* Brand Header */}
                <div className="flex flex-col items-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
                        <img src={logo} alt="RP" className="h-9 w-9 object-contain brightness-0 invert opacity-90" />
                    </div>
                    <div className="text-center">
                        <h1 className="mb-1 text-2xl font-semibold leading-none tracking-tight text-slate-950">Officer Sign In</h1>
                        <p className="text-sm text-slate-500">Maintenance portal</p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <AuthInput
                            label="Staff Email"
                            type="email"
                            placeholder="your.name@roadpulse.lk"
                            icon={<Mail />}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            error={errors.email}
                            required
                        />

                        {/* Provincial Council Selector */}
                        <div className="space-y-2">
                            <label className="ml-1 block text-sm font-medium text-slate-700">
                                Provincial Council
                            </label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                                <select
                                    value={selectedProvince}
                                    onChange={(e) => setSelectedProvince(e.target.value as ProvincialCouncil)}
                                    className="w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 transition-all focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                >
                                    <option value="" disabled>Select Province</option>
                                    {PROVINCIAL_COUNCILS.map(pc => (
                                        <option key={pc} value={pc}>{pc}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </div>
                            <p className="text-[9px] font-medium text-slate-400 pl-1">
                                You will only see reports from your assigned province
                            </p>
                        </div>

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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    Sign In <Shield size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-xs font-medium leading-none text-slate-500">RoadPulse official portal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;
