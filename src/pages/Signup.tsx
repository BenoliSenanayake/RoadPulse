import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, User, MapPin, ArrowRight, CheckCircle2, Phone, Loader2, ChevronLeft } from 'lucide-react';
import { Alert, type AlertType } from '../components/Alert';
import { AuthInput } from '../components/AuthInput';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import logo from '../assets/logo.png';

const Signup = () => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: AlertType; message: string; description?: string } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        district: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const { signup, getHomePath } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromLocation = location.state?.from as { pathname?: string; search?: string } | undefined;
    const from = fromLocation?.pathname
        ? `${fromLocation.pathname}${fromLocation.search ?? ''}`
        : getHomePath('CITIZEN');

    const districts = ['Colombo', 'Kandy', 'Gampaha', 'Galle', 'Jaffna', 'Matara'];

    const validateStep = () => {
        const newErrors: Record<string, string> = {};
        if (step === 1) {
            if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 chars';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email identity';
        } else if (step === 2) {
            if (!formData.district) newErrors.district = 'Regional sector required';
            if (formData.phone && !/^(?:\+94|0)7\d{8}$/.test(formData.phone)) {
                newErrors.phone = 'Invalid Sri Lanka format';
            }
        } else if (step === 3) {
            if (formData.password.length < 8 || !/\d/.test(formData.password)) {
                newErrors.password = 'Security key must be 8+ chars with 1+ number';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Security keys do not match';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isStepValid = useMemo(() => {
        if (step === 1) {
            return formData.name.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
        }
        if (step === 2) {
            const phoneValid = !formData.phone || /^(?:\+94|0)7\d{8}$/.test(formData.phone);
            return !!formData.district && phoneValid;
        }
        if (step === 3) {
            return formData.password.length >= 8 && /\d/.test(formData.password) && formData.password === formData.confirmPassword;
        }
        return false;
    }, [step, formData]);

    const handleNext = () => {
        if (validateStep()) setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep()) return;

        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1500));

        const result = await signup({
            name: formData.name,
            email: formData.email,
            passwordHash: formData.password,
            phone: formData.phone,
            district: formData.district
        });

        setIsLoading(false);

        if (result.success) {
            setFeedback({
                type: 'success',
                message: 'Identity Verified',
                description: 'Welcome to the RoadPulse network, Citizen.'
            });
            setTimeout(() => navigate(from, { replace: true }), 2000);
        } else {
            setFeedback({
                type: 'error',
                message: 'Onboarding Failed',
                description: result.error || 'System error during registration.'
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 relative overflow-hidden">
            {feedback && <Alert {...feedback} onClose={() => setFeedback(null)} />}

            {/* Premium Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#f1f5f9_0%,transparent_100%)]" />
                <div className="absolute inset-0 opacity-[0.03] grayscale bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="max-w-[400px] w-full relative z-10 flex flex-col gap-8">
                {/* Brand Header */}
                <div className="flex flex-col items-center">
                    <Link to="/login" state={{ from: location.state?.from }} className="w-16 h-16 bg-white rounded-2xl shadow-premium border border-slate-100 flex items-center justify-center mb-4 group hover:scale-105 transition-all duration-500">
                        <img src={logo} alt="RP" className="w-10 h-10 object-contain group-hover:-rotate-12 transition-transform duration-500" />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">Join Network</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Citizen Onboarding</p>
                    </div>
                </div>

                <div className="card-premium p-8 sm:p-10 border-none shadow-2xl shadow-slate-900/10 relative overflow-hidden">
                    {/* Stepper */}
                    <div className="flex gap-2 mb-8 px-1">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={cn(
                                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                                    step >= s ? "bg-slate-900" : "bg-slate-100"
                                )}
                            />
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {step === 1 && (
                            <div className="space-y-5 animate-fade-in-up">
                                <AuthInput
                                    label="Full Name"
                                    type="text"
                                    placeholder="e.g. John Perera"
                                    icon={<User />}
                                    value={formData.name}
                                    onChange={e => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (errors.name) setErrors({ ...errors, name: '' });
                                    }}
                                    error={errors.name}
                                    required
                                />

                                <AuthInput
                                    label="Email Identity"
                                    type="email"
                                    placeholder="john@example.com"
                                    icon={<Mail />}
                                    value={formData.email}
                                    onChange={e => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                    error={errors.email}
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!isStepValid}
                                    className="w-full mt-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
                                >
                                    Next Phase <ArrowRight size={16} />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5 animate-fade-in-up">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 lowercase first-letter:uppercase">Local District</label>
                                    <div className="relative group">
                                        <div className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300",
                                            errors.district ? "text-rose-400" : "text-slate-300 group-focus-within:text-slate-900"
                                        )}>
                                            <MapPin size={18} />
                                        </div>
                                        <select
                                            className={cn(
                                                "w-full pl-12 pr-4 py-4 bg-slate-50/50 border rounded-2xl focus:outline-none focus:ring-4 transition-all text-sm font-bold appearance-none cursor-pointer",
                                                errors.district ? "border-rose-200 focus:ring-rose-500/10" : "border-slate-100 focus:ring-slate-900/5"
                                            )}
                                            value={formData.district}
                                            onChange={e => {
                                                setFormData({ ...formData, district: e.target.value });
                                                if (errors.district) setErrors({ ...errors, district: '' });
                                            }}
                                        >
                                            <option value="">Select District</option>
                                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    {errors.district && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-2 uppercase tracking-wide">{errors.district}</p>}
                                </div>

                                <AuthInput
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="e.g. 0771234567"
                                    icon={<Phone />}
                                    value={formData.phone}
                                    onChange={e => {
                                        setFormData({ ...formData, phone: e.target.value });
                                        if (errors.phone) setErrors({ ...errors, phone: '' });
                                    }}
                                    error={errors.phone}
                                />

                                <div className="flex gap-4 mt-2">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="flex-1 py-4 bg-white text-slate-500 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeft size={16} /> Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!isStepValid}
                                        className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        Secure Key <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-5 animate-fade-in-up">
                                <AuthInput
                                    label="Security Key"
                                    type="password"
                                    placeholder="At least 8 chars"
                                    icon={<Lock />}
                                    showPasswordToggle
                                    value={formData.password}
                                    onChange={e => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (errors.password) setErrors({ ...errors, password: '' });
                                    }}
                                    error={errors.password}
                                    required
                                />

                                <AuthInput
                                    label="Confirm Key"
                                    type="password"
                                    placeholder="Re-enter security key"
                                    icon={<Lock />}
                                    value={formData.confirmPassword}
                                    onChange={e => {
                                        setFormData({ ...formData, confirmPassword: e.target.value });
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                    }}
                                    error={errors.confirmPassword}
                                    required
                                />

                                <div className="flex gap-4 mt-2">
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={handleBack}
                                        className="flex-1 py-4 bg-white text-slate-500 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <ChevronLeft size={16} /> Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !isStepValid}
                                        className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <>
                                                Join Network <CheckCircle2 size={16} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <p className="text-xs font-bold text-slate-400">
                            Already registered? <Link to="/login" state={{ from: location.state?.from }} className="text-slate-900 font-black hover:underline underline-offset-4 uppercase tracking-widest ml-1">Sign In</Link>
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={() => setFeedback({ type: 'info', message: 'Recovery Protocol', description: 'Self-service recovery is coming soon. Contact support for key reset.' })}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                        Support
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Signup;
