import { Link } from 'react-router-dom';
import {
    Camera,
    MapPin,
    CheckCircle,
    PlusCircle,
    FileText,
    ShieldAlert,
    Clock,
    ArrowRight,
} from 'lucide-react';
import type React from 'react';

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
                <section className="relative -mt-5 z-20 mb-10" aria-label="Public service highlights">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <InfoCard icon={Camera} title="Photo first" text="Use a clear, safe photo of the road damage." color="blue" />
                        <InfoCard icon={MapPin} title="Exact location" text="Confirm the spot so crews know where to go." color="emerald" />
                        <InfoCard icon={Clock} title="Track updates" text="Sign in when you want to view your own reports." color="amber" />
                    </div>
                </section>

                <section className="mb-10" aria-label="How it works">
                    <div className="flex items-baseline justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">How it works</h2>
                        <span className="text-xs text-slate-400 font-medium hidden sm:block">3 simple steps</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { step: 1, icon: Camera, title: 'Take a Photo', desc: 'Snap a clear photo from a safe spot.' },
                            { step: 2, icon: MapPin, title: 'Confirm Location', desc: 'Use GPS or tap the map to pin the exact place.' },
                            { step: 3, icon: CheckCircle, title: 'Submit Report', desc: 'Sign in, send the report, and check updates later.' },
                        ].map(item => (
                            <div key={item.step} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 text-slate-700">
                                    <item.icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Step {item.step}</span>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-10">
                    <div className="bg-slate-900 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
                        <div>
                            <h3 className="text-base font-bold mb-1">Ready to report a pothole?</h3>
                            <p className="text-sm text-slate-400">You can browse this page freely. We will ask you to sign in only when you start a report or view your reports.</p>
                        </div>
                        <Link to="/citizen/report" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors shrink-0">
                            Start Report <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

                <section className="mb-6" aria-label="Safety reminder">
                    <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-5 py-4 flex gap-3.5 items-start">
                        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <ShieldAlert size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-amber-900 mb-0.5">Safety first</h3>
                            <p className="text-xs sm:text-sm text-amber-700/90 leading-relaxed">
                                Only report when it is safe. Never take photos while driving. Pull over or ask a passenger.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

interface InfoCardProps {
    icon: React.ElementType;
    title: string;
    text: string;
    color: 'blue' | 'emerald' | 'amber';
}

const colorMap = {
    blue: { iconBg: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { iconBg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { iconBg: 'bg-amber-50', text: 'text-amber-600' },
};

const InfoCard = ({ icon: Icon, title, text, color }: InfoCardProps) => {
    const c = colorMap[color];

    return (
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-md shadow-slate-200/60">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${c.iconBg} ${c.text}`}>
                <Icon size={16} />
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">{title}</p>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">{text}</p>
        </div>
    );
};

export default CitizenHome;
