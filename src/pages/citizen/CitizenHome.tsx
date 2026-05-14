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
    <div className="card-premium p-8 flex flex-col items-start text-left">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#4F6FAF] border border-[#DCE3EE]">
            <Icon size={22} />
        </div>
        <h3 className="mb-3 text-base font-bold text-[#0F172A]">{title}</h3>
        <p className="text-sm leading-relaxed text-[#64748B]">{desc}</p>
    </div>
);

const CitizenHome = () => {
    return (
        <div className="bg-[#F7F9FC] pb-24 theme-citizen">
            <section className="bg-white border-b border-[#DCE3EE]">
                <div className="mx-auto grid max-w-7xl gap-16 px-6 py-32 lg:grid-cols-[1fr_420px] lg:items-center">
                    <div className="space-y-12">
                        <div className="space-y-8">
                            <span className="inline-flex items-center gap-2.5 rounded-full border border-[#DCE3EE] bg-[#F7F9FC] px-5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#64748B]">
                                <ShieldCheck size={14} className="text-[#4F6FAF]" />
                                OFFICIAL ROAD MAINTENANCE PORTAL
                            </span>
                            <h1 className="max-w-2xl text-[48px] font-bold tracking-[-0.01em] text-[#0F172A] leading-[1.2]">
                                Report road damage and track repair progress.
                            </h1>
                            <p className="max-w-xl text-xl leading-[1.6] text-[#64748B] font-medium">
                                RoadPulse connects citizens directly with maintenance divisions. Submit clear reports with photos and location data to help keep our roads safe.
                            </p>
                        </div>

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                            <Link
                                to="/citizen/report"
                                className="btn-premium bg-[#4F6FAF] hover:bg-[#3E5C96] text-white px-10 py-5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-wider text-sm"
                            >
                                <PlusCircle size={20} />
                                REPORT A POTHOLE
                            </Link>
                            <Link
                                to="/citizen/my-reports"
                                className="btn-premium bg-white border border-[#DCE3EE] hover:bg-[#F7F9FC] text-[#0F172A] px-10 py-5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-wider text-sm"
                            >
                                <FileText size={20} className="text-[#64748B]" />
                                VIEW MY REPORTS
                            </Link>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative card-premium p-10 shadow-xl border-[#DCE3EE] bg-white overflow-hidden rounded-[24px]">
                            <div className="absolute top-8 right-8 text-[#EAF2FF]">
                                <ShieldCheck size={28} />
                            </div>
                            <div className="mb-10">
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4F6FAF] mb-1">PROCESS</p>
                                <h3 className="text-xl font-bold text-[#0F172A]">Submission Workflow</h3>
                            </div>
                            <div className="space-y-8">
                                {[
                                    { icon: Camera, title: 'Capture Photo', desc: 'Secure evidence of road damage.' },
                                    { icon: MapPin, title: 'Pin Location', desc: 'Auto-detect or manual placement.' },
                                    { icon: Navigation, title: 'Add Details', desc: 'Landmarks or specific notes.' },
                                    { icon: CheckCircle, title: 'Live Tracking', desc: 'Real-time status updates.' },
                                ].map((item) => (
                                    <div key={item.title} className="flex gap-6 group">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#4F6FAF] border border-[#DCE3EE] transition-all">
                                            <item.icon size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-base font-bold text-[#0F172A]">{item.title}</p>
                                            <p className="text-sm leading-relaxed text-[#64748B]">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-6 py-24">
                <section aria-label="Designed for public service">
                    <div className="mb-16">
                        <h2 className="text-4xl font-bold tracking-tight text-[#0F172A]">Designed for public service</h2>
                        <p className="mt-4 text-xl text-[#64748B] max-w-2xl">A clean, transparent system for reporting and tracking road maintenance.</p>
                    </div>
                    {/* Feature Cards below... */}
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        <FeatureCard
                            icon={Clock}
                            title="Live Lifecycle"
                            desc="Monitor the official state of your reports from triage to final repair completion."
                        />
                        <FeatureCard
                            icon={MapPin}
                            title="Provincial Routing"
                            desc="Automatic association with the relevant jurisdictional maintenance council."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Government Grade"
                            desc="Official system used by municipal divisions for scheduled road maintenance."
                        />
                        <FeatureCard
                            icon={CheckCircle}
                            title="Infrastructure First"
                            desc="Prioritizing public safety through data-driven road damage evaluation."
                        />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CitizenHome;
