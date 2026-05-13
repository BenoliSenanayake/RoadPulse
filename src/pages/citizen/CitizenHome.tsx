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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-slate-200">
            <Icon size={19} />
        </div>
        <h3 className="mb-1.5 text-sm font-semibold text-slate-950">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
    </div>
);

const CitizenHome = () => {
    return (
        <div className="bg-white pb-16">
            <section className="border-b border-slate-200 bg-slate-50">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-16">
                    <div>
                        <p className="mb-4 inline-flex rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                            Public road maintenance reporting
                        </p>
                        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                            Report road damage and follow the repair status.
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                            RoadPulse helps citizens submit clear pothole reports with a photo, location, and short description so maintenance teams can review and respond.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                to="/citizen/report"
                                id="hero-cta-report"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                            >
                                <PlusCircle size={18} />
                                Report a pothole
                            </Link>
                            <Link
                                to="/citizen/my-reports"
                                id="hero-cta-reports"
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
                            >
                                <FileText size={18} />
                                View my reports
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-950">Current report flow</p>
                                <p className="text-sm text-slate-500">Simple four-step submission</p>
                            </div>
                            <ShieldCheck size={20} className="text-slate-500" />
                        </div>
                        <div className="space-y-3">
                            {[
                                { icon: Camera, title: 'Photo', desc: 'Capture a clear image from a safe location.' },
                                { icon: MapPin, title: 'Location', desc: 'Confirm GPS or place the pin manually.' },
                                { icon: Navigation, title: 'Details', desc: 'Add a short landmark or description.' },
                                { icon: CheckCircle, title: 'Tracking', desc: 'Follow review and repair progress later.' },
                            ].map((item) => (
                                <div key={item.title} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-600 ring-1 ring-slate-200">
                                        <item.icon size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                                        <p className="text-xs leading-5 text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
                <section aria-label="Why Use RoadPulse">
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Built for clear public reporting</h2>
                            <p className="mt-1 text-sm text-slate-600">The portal keeps the reporting process short, traceable, and easy to understand.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <FeatureCard
                            icon={Clock}
                            title="Trackable updates"
                            desc="Submitted reports can be checked later from your account."
                        />
                        <FeatureCard
                            icon={MapPin}
                            title="Province routing"
                            desc="Reports are associated with the relevant local maintenance area."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Officer review"
                            desc="Maintenance staff review submissions before repair action."
                        />
                        <FeatureCard
                            icon={CheckCircle}
                            title="Clear status"
                            desc="Each report moves through practical review and repair states."
                        />
                    </div>
                </section>

                <section className="mt-12 grid gap-4 lg:grid-cols-[1fr_0.75fr]">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-950">How it works</h2>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {[
                                { step: '1', icon: Camera, title: 'Take a photo', desc: 'Use a clear, safe angle.' },
                                { step: '2', icon: MapPin, title: 'Confirm location', desc: 'Use GPS or the map pin.' },
                                { step: '3', icon: FileText, title: 'Submit details', desc: 'Add a short description.' },
                            ].map(item => (
                                <div key={item.step} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-700 ring-1 ring-slate-200">
                                            <item.icon size={17} />
                                        </div>
                                        <span className="text-xs font-medium text-slate-500">Step {item.step}</span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                        <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 ring-1 ring-amber-200">
                                <AlertTriangle size={19} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-950">Safety first</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Only report when it is safe. Never take photos while driving. Pull over safely or ask a passenger.
                                </p>
                                <Link to="/citizen/report" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-950 hover:text-blue-700">
                                    Start a report
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
