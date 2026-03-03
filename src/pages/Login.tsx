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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center mb-6">
                        <img src={logo} alt="RoadPulse Logo" className="w-24 h-24 object-contain drop-shadow-2xl brightness-110" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">RoadPulse</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">National Infrastructure Command</p>
                </div>

                <div className="card-premium p-10 border-none shadow-2xl shadow-slate-900/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 rounded-bl-full translate-x-16 -translate-y-16 group-hover:scale-125 transition-transform duration-1000" />

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Operator Identity</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <select
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all appearance-none text-xs font-black text-slate-900 uppercase tracking-tighter cursor-pointer"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                >
                                    <option value="admin@roadpulse.lk">Central Command (Admin)</option>
                                    <option value="officer@roadpulse.lk">Field Operator (Officer)</option>
                                    <option value="citizen@roadpulse.lk">Intel Node (Citizen)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Protocol Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="password"
                                    defaultValue="••••••••"
                                    disabled
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-[8px] font-black text-slate-300 cursor-not-allowed uppercase tracking-[0.5em]"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            Authorize
                            <LogIn size={16} />
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-50 text-center relative z-10">
                        <p className="text-[9px] text-slate-300 font-bold leading-relaxed uppercase tracking-widest">
                            Authorized Operations Only.<br />
                            <span className="opacity-50">Secure Session Encrypted</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
