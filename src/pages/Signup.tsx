import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react';
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
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const { signup, getHomePath } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromLocation = location.state?.from as { pathname?: string; search?: string } | undefined;
    const from = fromLocation?.pathname
        ? `${fromLocation.pathname}${fromLocation.search ?? ''}`
        : getHomePath('CITIZEN');

    const getRedirectTarget = () => {
        // Enforce role separation
        if (from.startsWith('/staff') || from.startsWith('/admin')) {
            return getHomePath('CITIZEN');
        }
        return from;
    };



    const validateStep = () => {
        const newErrors: Record<string, string> = {};
        if (step === 1) {
            if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 chars';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email identity';
        } else if (step === 2) {
            const hasLetter = /[a-zA-Z]/.test(formData.password);
            const hasNumber = /\d/.test(formData.password);
            const hasSpecial = /[^a-zA-Z0-9]/.test(formData.password);
            
            if (formData.password.length < 8 || !hasLetter || !hasNumber || !hasSpecial) {
                newErrors.password = 'Security key must be 8+ chars with letters, numbers, and 1+ special character';
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
            const hasLetter = /[a-zA-Z]/.test(formData.password);
            const hasNumber = /\d/.test(formData.password);
            const hasSpecial = /[^a-zA-Z0-9]/.test(formData.password);
            return formData.password.length >= 8 && hasLetter && hasNumber && hasSpecial && formData.password === formData.confirmPassword;
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
            status: 'ACTIVE'
        });

        setIsLoading(false);

        if (result.success) {
            setFeedback({
                type: 'success',
                message: 'Identity Verified',
                description: 'Welcome to the RoadPulse network, Citizen.'
            });
            setTimeout(() => navigate(getRedirectTarget(), { replace: true }), 2000);
        } else {
            setFeedback({
                type: 'error',
                message: 'Onboarding Failed',
                description: result.error || 'System error during registration.'
            });
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-8 theme-citizen">
            {feedback && <Alert {...feedback} onClose={() => setFeedback(null)} />}

            <div className="relative z-10 flex w-full max-w-[400px] flex-col gap-10">
                {/* Brand Header */}
                <div className="flex flex-col items-center">
                    <Link to="/login" state={{ from: location.state?.from }} className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#DCE3EE] bg-white shadow-md transition-all hover:border-[#4F6FAF] hover:shadow-lg">
                        <img src={logo} alt="RP" className="h-10 w-10 object-contain" />
                    </Link>
                    <div className="text-center space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">Join RoadPulse</h1>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#4F6FAF]">Citizen Registration</p>
                    </div>
                </div>

                <div className="card-premium relative overflow-hidden p-8 sm:p-10 bg-white border-[#DCE3EE] shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4F6FAF]" />
                    
                    {/* Stepper */}
                    <div className="flex gap-3 mb-10 px-1">
                        {[1, 2].map((s) => (
                            <div
                                key={s}
                                className={cn(
                                    "h-2 flex-1 rounded-full transition-all duration-700",
                                    step >= s ? "bg-[#4F6FAF]" : "bg-[#F1F5F9]"
                                )}
                            />
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in-up">
                                <AuthInput
                                    label="Full Legal Name"
                                    type="text"
                                    placeholder="e.g. Chaminda Perera"
                                    icon={<User className="text-[#94A3B8]" />}
                                    value={formData.name}
                                    onChange={e => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (errors.name) setErrors({ ...errors, name: '' });
                                    }}
                                    error={errors.name}
                                    required
                                />

                                <AuthInput
                                    label="Email Address"
                                    type="email"
                                    placeholder="e.g. name@provider.com"
                                    icon={<Mail className="text-[#94A3B8]" />}
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
                                    className="mt-4 flex w-full items-center justify-center gap-3 bg-[#4F6FAF] py-4 rounded-xl text-base font-bold text-white transition-all shadow-lg hover:bg-[#3E5C96] hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                                >
                                    Proceed <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in-up">
                                <AuthInput
                                    label="Security Key"
                                    type="password"
                                    placeholder="Min 8 chars, incl. symbols"
                                    icon={<Lock className="text-[#94A3B8]" />}
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
                                    label="Confirm Security Key"
                                    type="password"
                                    placeholder="Re-enter for verification"
                                    icon={<Lock className="text-[#94A3B8]" />}
                                    value={formData.confirmPassword}
                                    onChange={e => {
                                        setFormData({ ...formData, confirmPassword: e.target.value });
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                    }}
                                    error={errors.confirmPassword}
                                    required
                                />

                                <div className="flex gap-4 mt-4">
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={handleBack}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#F1F5F9] bg-white py-4 text-sm font-bold text-[#64748B] transition-all hover:bg-[#F7F9FC] active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !isStepValid}
                                        className="flex flex-[3] items-center justify-center gap-3 bg-[#0F172A] py-4 rounded-xl text-base font-bold text-white transition-all shadow-lg hover:bg-black hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                Finalize Account <CheckCircle2 size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="mt-10 pt-8 border-t border-[#F1F5F9] text-center">
                        <p className="text-sm font-bold text-[#64748B]">
                            Already registered? <Link to="/login" state={{ from: location.state?.from }} className="ml-2 font-extrabold text-[#0F172A] hover:text-[#4F6FAF] transition-colors underline-offset-4 hover:underline">Sign In</Link>
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-8">
                    <button
                        onClick={() => setFeedback({ type: 'info', message: 'Regional Support', description: 'Technical assistance is available 24/7 for citizen accounts.' })}
                        className="text-xs font-bold uppercase tracking-[0.2em] text-[#94A3B8] transition-colors hover:text-[#4F6FAF]"
                    >
                        Support Center
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Signup;
