import type React from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowRight,
    Camera,
    CheckCircle,
    Clock,
    FileText,
    MapPin,
    Navigation,
    PlusCircle,
    ShieldCheck,
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) => (
    <div className="card-premium p-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
            <Icon size={18} />
        </div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
    </div>
);

const CitizenHome = () => {
    return (
        <div className="bg-white pb-16 theme-citizen">
            <section className="border-b border-slate-100 bg-[#f9fafb]">
                <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_400px] lg:items-center">
                    <div className="space-y-8">
                        <div>
                            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-text)]">
                                <ShieldCheck size={12} />
                                Official Road Maintenance Portal
                            </span>
                            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.1]">
                                Report road damage and track repair progress.
                            </h1>
                            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-500">
                                RoadPulse connects citizens directly with maintenance divisions. Submit clear reports with photos and location data to help keep our roads safe.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Link
                                to="/citizen/report"
                                className="btn-premium btn-primary px-8 py-3.5 shadow-sm"
                            >
                                <PlusCircle size={18} />
                                Report a pothole
                            </Link>
                            <Link
                                to="/citizen/my-reports"
                                className="btn-premium btn-secondary px-8 py-3.5"
                            >
                                <FileText size={18} />
                                View my reports
                            </Link>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-slate-200/20 blur-2xl rounded-[2rem]" />
                        <div className="relative card-premium p-6 shadow-md border-slate-200/60 bg-white">
                            <div className="mb-6 flex items-center justify-between border-b border-slate-50 pb-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Process</p>
                                    <h3 className="text-sm font-semibold text-slate-900">Submission Workflow</h3>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                    <ShieldCheck size={18} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { icon: Camera, title: 'Capture Photo', desc: 'Secure evidence of road damage.' },
                                    { icon: MapPin, title: 'Pin Location', desc: 'Auto-detect or manual placement.' },
                                    { icon: Navigation, title: 'Add Details', desc: 'Landmarks or specific notes.' },
                                    { icon: CheckCircle, title: 'Live Tracking', desc: 'Real-time status updates.' },
                                ].map((item) => (
                                    <div key={item.title} className="flex gap-4 group">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-[var(--accent-bg)] group-hover:text-[var(--accent-text)] transition-colors border border-slate-100">
                                            <item.icon size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                            <p className="text-[11px] leading-relaxed text-slate-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                <section aria-label="Why Use RoadPulse">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Designed for public service</h2>
                        <p className="mt-2 text-slate-500">A clean, transparent system for reporting and tracking road maintenance.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <FeatureCard
                            icon={Clock}
                            title="Live Updates"
                            desc="Real-time status tracking from submission to repair completion."
                        />
                        <FeatureCard
                            icon={MapPin}
                            title="Geo-Routing"
                            desc="Automatic association with local provincial council divisions."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Verified Data"
                            desc="Human-in-the-loop review ensures actionable maintenance data."
                        />
                        <FeatureCard
                            icon={CheckCircle}
                            title="Clear Lifecycle"
                            desc="Simplified 5-step status system for better public transparency."
                        />
                    </div>
                </section>

                <section className="mt-24 grid gap-8 lg:grid-cols-[1fr_350px]">
                    <div className="card-premium p-8">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900 mb-8">How it works</h2>
                        <div className="grid gap-6 sm:grid-cols-3">
                            {[
                                { step: '01', icon: Camera, title: 'Take Photo', desc: 'Secure a clear image of the damage.' },
                                { step: '02', icon: MapPin, title: 'Location', desc: 'Confirm the precise GPS coordinates.' },
                                { step: '03', icon: FileText, title: 'Submit', desc: 'Send your report for official review.' },
                            ].map(item => (
                                <div key={item.step} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent-text)]">
                                            <item.icon size={18} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-300 tracking-widest">{item.step}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                                        <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-8">
                        <div className="flex flex-col gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Safety Notice</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                    Only capture reports from a safe position. Pull over safely if you are driving. Your safety is more important than the report.
                                </p>
                                <Link to="/citizen/report" className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 hover:text-[var(--accent-text)] transition-colors">
                                    Start Reporting
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CitizenHome;
