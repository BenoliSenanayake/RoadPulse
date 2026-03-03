import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn } from 'lucide-react';
import logo from '../assets/logo.png';

const LoginPage = () => {
    const [email, setEmail] = useState('officer@roadpulse.lk');
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/overview';

    if (isAuthenticated) {
        navigate(from, { replace: true });
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email);
        navigate(from, { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-4">
                        <img src={logo} alt="RoadPulse Logo" className="w-20 h-20 object-contain drop-shadow-xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">RoadPulse</h1>
                    <p className="text-gray-500">Sri Lanka Road Maintenance Portal</p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                >
                                    <option value="admin@roadpulse.lk">Admin (admin@roadpulse.lk)</option>
                                    <option value="officer@roadpulse.lk">Officer (officer@roadpulse.lk)</option>
                                    <option value="citizen@roadpulse.lk">Citizen (citizen@roadpulse.lk)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    defaultValue="••••••••"
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-border rounded-xl text-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            Sign In
                            <LogIn size={20} />
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-border text-center">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Authorized Personnel Only.<br />
                            This system is monitored for security purposes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
