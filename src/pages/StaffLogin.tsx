import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ChevronLeft, Loader2, MapPin } from 'lucide-react';
import { AuthInput } from '../components/AuthInput';
import { Alert, type AlertType } from '../components/Alert';
import { PROVINCIAL_COUNCILS, type ProvincialCouncil } from '../types';
import type { UserRole } from '../types';
import logo from '../assets/logo.png';

const StaffLogin = () => {
    const [email, setEmail] = useState('western@roadpulse.lk');
    const [password, setPassword] = useState('');
    const [selectedProvince, setSelectedProvince] = useState<ProvincialCouncil>('Western Provincial Council');
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

        const result = await login(email, password, selectedProvince);
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
        <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8 relative overflow-hidden">
            {feedback && <Alert {...feedback} onClose={() => setFeedback(null)} />}

            {/* Clean Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />

            <div className="max-w-[420px] w-full relative z-10 flex flex-col gap-8">
                {/* Brand Header */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center mb-4 border border-white/10 group">
                        <img src={logo} alt="RP" className="w-10 h-10 object-contain brightness-0 invert opacity-90 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-slate-900 tracking-[0.15em] uppercase leading-none mb-2">Officer Sign In</h1>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Maintenance Portal</p>
                    </div>
                </div>

                <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-950/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full translate-x-16 -translate-y-16" />

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
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Provincial Council
                            </label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                                <select
                                    value={selectedProvince}
                                    onChange={(e) => setSelectedProvince(e.target.value as ProvincialCouncil)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/60 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all cursor-pointer"
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
                            className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-950/20 hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-2"
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
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">RoadPulse Official Portal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;
