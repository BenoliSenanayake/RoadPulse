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
            <section className="relative bg-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_-10%,rgba(59,130,246,0.18),transparent)] pointer-events-none" />
                <div className="relative z-10 max-w-5xl mx-auto px-5 py-12 sm:px-8 sm:py-16">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 leading-snug tracking-tight">
                        Report road damage in minutes
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base font-normal leading-relaxed max-w-lg mb-8">
                        Help keep local roads safer by sending a clear photo and location. RoadPulse will guide you through each step when you are ready.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            to="/citizen/report"
                            id="hero-cta-report"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-blue-600/20"
                        >
                            <PlusCircle size={18} />
                            Report a Pothole
                        </Link>
                        <Link
                            to="/citizen/my-reports"
                            id="hero-cta-reports"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 rounded-xl font-semibold text-sm transition-colors"
                        >
                            <FileText size={18} />
                            My Reports
                        </Link>
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

