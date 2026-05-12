import { Link } from 'react-router-dom';
import {
    Camera,
    MapPin,
    CheckCircle,
    PlusCircle,
    FileText,
    ShieldAlert,
    ArrowRight,
    Activity,
    Navigation,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type React from 'react';

const FeatureCard = ({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) => (
    <div className="group bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-300">
        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/30 transition-all duration-300">
            <Icon size={22} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-[13px] text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
);

const CitizenHome = () => {
    return (
        <div className="pb-16 md:pb-8">
            <section className="relative bg-slate-950 text-white overflow-hidden py-16 sm:py-24">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.25),transparent)] pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                
                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Public Service Platform</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                            Fixing Sri Lanka's <br className="hidden sm:block" />
                            <span className="text-blue-500">Roads Together.</span>
                        </h1>
                        <p className="text-slate-400 text-base sm:text-lg font-bold leading-relaxed max-w-xl mb-10 uppercase tracking-tight">
                            Snap, Tag, and Track. Your reports help maintenance teams prioritize repairs in your province.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                to="/citizen/report"
                                id="hero-cta-report"
                                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs transition-all shadow-2xl shadow-blue-600/30 active:scale-95 uppercase tracking-widest"
                            >
                                <PlusCircle size={20} />
                                Report Pothole
                            </Link>
                            <Link
                                to="/citizen/my-reports"
                                id="hero-cta-reports"
                                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-xs transition-all active:scale-95 uppercase tracking-widest backdrop-blur-sm"
                            >
                                <FileText size={20} />
                                My Activity
                            </Link>
                        </div>
                    </div>

                    <div className="hidden lg:block relative w-80 h-80">
                        <div className="absolute inset-0 bg-blue-600/20 rounded-[3rem] blur-3xl animate-pulse" />
                        <div className="relative bg-slate-900 border border-white/10 rounded-[3rem] w-full h-full p-8 shadow-2xl flex flex-col justify-center gap-6 overflow-hidden">
                            <div className="space-y-2">
                                <div className="h-1 w-12 bg-blue-500 rounded-full" />
                                <div className="h-4 w-full bg-white/5 rounded-lg" />
                                <div className="h-4 w-2/3 bg-white/5 rounded-lg" />
                            </div>
                            <div className="aspect-video bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center">
                                <Camera size={32} className="text-white/20" />
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="h-8 w-24 bg-blue-600/50 rounded-xl" />
                                <div className="w-8 h-8 rounded-full bg-white/10" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Why Use RoadPulse Section */}
                <section className="relative -mt-8 z-20 mb-12" aria-label="Why Use RoadPulse">
                    <div className="flex items-center gap-3 mb-6 bg-white p-2 rounded-xl inline-flex pr-5 shadow-sm border border-slate-100">
                        <div className="w-2 h-6 bg-blue-500 rounded-full" />
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.15em]">Why Use RoadPulse?</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FeatureCard 
                            icon={Activity} 
                            title="Real-Time Tracking" 
                            desc="Follow the progress of your submitted road issue from review to completion." 
                        />
                        <FeatureCard 
                            icon={Navigation} 
                            title="Province-Based Response" 
                            desc="Reports are automatically routed to the correct provincial maintenance team." 
                        />
                        <FeatureCard 
                            icon={ShieldCheck} 
                            title="AI-Assisted Verification" 
                            desc="RoadPulse helps maintenance officers identify genuine road damage faster." 
                        />
                        <FeatureCard 
                            icon={Users} 
                            title="Safer Roads Together" 
                            desc="Every citizen report contributes to improving road safety across Sri Lanka." 
                        />
                    </div>
                </section>

                <section className="mb-12" aria-label="How it works">
                    <div className="flex items-baseline justify-between mb-6">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">How it works</h2>
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">3 Simple Steps</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { step: 1, icon: Camera, title: 'Take a Photo', desc: 'Snap a clear photo from a safe spot.' },
                            { step: 2, icon: MapPin, title: 'Confirm Location', desc: 'Use GPS or tap the map to pin the exact place.' },
                            { step: 3, icon: CheckCircle, title: 'Submit Report', desc: 'Sign in, send the report, and check updates later.' },
                        ].map(item => (
                            <div key={item.step} className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:border-blue-100 hover:shadow-md transition-all duration-300">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <item.icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Step {item.step}</span>
                                    <h3 className="text-[15px] font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-10">
                    <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-white shadow-xl shadow-slate-900/10 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-500/20 transition-colors duration-500" />
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-1">Ready to report a pothole?</h3>
                            <p className="text-sm text-slate-400 max-w-md">You can browse this page freely. We will ask you to sign in only when you start a report or view your reports.</p>
                        </div>
                        <Link to="/citizen/report" className="relative z-10 inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-all hover:scale-105 active:scale-95 shrink-0 shadow-lg">
                            Start Report <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

                <section className="mb-6" aria-label="Safety reminder">
                    <div className="bg-amber-50/50 border border-amber-200/40 rounded-2xl px-5 py-4 flex gap-4 items-start shadow-sm shadow-amber-900/5">
                        <div className="w-10 h-10 bg-amber-100/80 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                            <ShieldAlert size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold text-amber-900 mb-0.5">Safety first</h3>
                            <p className="text-sm text-amber-800/80 leading-relaxed font-medium">
                                Only report when it is safe. Never take photos while driving. Pull over or ask a passenger.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CitizenHome;

