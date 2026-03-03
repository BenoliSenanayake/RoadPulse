import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ChevronLeft, Loader2 } from 'lucide-react';
import { AuthInput } from '../components/AuthInput';
import { Alert, type AlertType } from '../components/Alert';
import logo from '../assets/logo.png';

const StaffLogin = () => {
    const [email, setEmail] = useState('admin@roadpulse.lk');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [feedback, setFeedback] = useState<{ type: AlertType; message: string; description?: string } | null>(null);

    const { login, isAuthenticated, getHomePath } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated) {
        navigate('/overview');
    }

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Command email invalid";
        }
        if (password.length < 1) {
            newErrors.password = "Authentication key required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1800));

        const result = await login(email, password);
        setIsLoading(false);

        if (result.success) {
            navigate(getHomePath());
        } else {
            setFeedback({
                type: 'error',
                message: 'Access Restricted',
                description: result.error || 'Identity not authorized for this portal.'
            });
            setErrors({ password: 'Key rejected' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8 relative overflow-hidden">
            {feedback && <Alert {...feedback} onClose={() => setFeedback(null)} />}

            {/* Clean Tactical Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />

            <div className="max-w-[400px] w-full relative z-10 flex flex-col gap-8">
                {/* Brand Header */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center mb-4 border border-white/10 group">
                        <img src={logo} alt="RP" className="w-10 h-10 object-contain brightness-0 invert opacity-90 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-slate-900 tracking-[0.2em] uppercase leading-none mb-2">Staff Command</h1>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Internal Security Portal</p>
                    </div>
                </div>

                <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-950/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full translate-x-16 -translate-y-16" />

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <AuthInput
                            label="Staff Identity"
                            type="email"
                            placeholder="command@roadpulse.lk"
                            icon={<Mail />}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            error={errors.email}
                            required
                        />

                        <AuthInput
                            label="Security Protocol Key"
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
                                    Grant Access <Shield size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <Link to="/login" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-2 group">
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Return to Citizen Portal
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Secured by RoadPulse Tactical Layer</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;
