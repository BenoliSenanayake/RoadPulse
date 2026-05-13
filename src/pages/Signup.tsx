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
        <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
            {feedback && <Alert {...feedback} onClose={() => setFeedback(null)} />}

            <div className="relative z-10 flex w-full max-w-[400px] flex-col gap-7">
                {/* Brand Header */}
                <div className="flex flex-col items-center">
                    <Link to="/login" state={{ from: location.state?.from }} className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                        <img src={logo} alt="RP" className="h-9 w-9 object-contain" />
                    </Link>
                    <div className="text-center">
                        <h1 className="mb-1 text-2xl font-semibold leading-none tracking-tight text-slate-950">Create Account</h1>
                        <p className="text-sm text-slate-500">Citizen registration</p>
                    </div>
                </div>

                <div className="card-premium relative overflow-hidden p-7 sm:p-8">
                    {/* Stepper */}
                    <div className="flex gap-2 mb-8 px-1">
                        {[1, 2].map((s) => (
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
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                                >
                                    Continue <ArrowRight size={16} />
                                </button>
                            </div>
                        )}



                        {step === 2 && (
                            <div className="space-y-5 animate-fade-in-up">
                                <AuthInput
                                    label="Security Key"
                                    type="password"
                                    placeholder="8+ chars, letters, numbers, symbols"
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
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft size={16} /> Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !isStepValid}
                                        className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <>
                                                Create account <CheckCircle2 size={16} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <p className="text-sm text-slate-500">
                            Already registered? <Link to="/login" state={{ from: location.state?.from }} className="ml-1 font-medium text-slate-950 hover:underline underline-offset-4">Sign in</Link>
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={() => setFeedback({ type: 'info', message: 'Recovery Protocol', description: 'Self-service recovery is coming soon. Contact support for key reset.' })}
                        className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                    >
                        Support
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Signup;
