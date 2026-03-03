import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPotholeById, listCitizenReports } from '../../lib/api';
import {
    ArrowLeft, Navigation, MapPin, Calendar, Link as LinkIcon,
    Shield, Clock
} from 'lucide-react';
import { ActivityTimeline } from '../../components/ActivityTimeline';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import type { CitizenReport, PotholeEvent } from '../../types';
import { StatusPill } from '../../components/StatusPill';

const ReportStatus = () => {
    const { id } = useParams();
    const [report, setReport] = useState<CitizenReport | null>(null);
    const [pothole, setPothole] = useState<PotholeEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const all = listCitizenReports();
            const found = all.find(r => r.id === id);
            if (found) {
                setReport(found);
                if (found.linkedPotholeId) {
                    const p = getPotholeById(found.linkedPotholeId);
                    setPothole(p || null);
                }
            }
            setLoading(false);
        }
    }, [id]);

    if (loading) return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <Clock className="text-slate-200 animate-spin" size={40} />
        </div>
    );

    if (!report) return (
        <div className="max-w-xl mx-auto p-12 text-center space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Record Not Found</h2>
            <p className="text-slate-500">The telemetry packet you're looking for does not exist.</p>
            <Link to="/citizen/my-reports" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900">
                <ArrowLeft size={16} /> Back to History
            </Link>
        </div>
    );

    const isAccepted = report.aiStatus === 'ACCEPTED';

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 pb-32 space-y-8 animate-in fade-in duration-500">
            <Link
                to="/citizen/my-reports"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Command
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Intel */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50">
                        <div className="h-64 sm:h-80 w-full relative">
                            <img src={report.imageUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-6 left-6 shadow-2xl scale-125 origin-top-left">
                                <StatusPill status={report.aiStatus as any} className="shadow-2xl border-none" />
                            </div>
                        </div>

                        <div className="p-8 sm:p-10 space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-8">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">
                                        Submission Report
                                    </h1>
                                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                                        Packet ID: {report.id}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Date Logged</p>
                                    <p className="text-sm font-bold text-slate-900 uppercase">
                                        {format(new Date(report.createdAt), 'dd MMM yyyy')}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <MapPin size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Coordinates</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        {report.lat.toFixed(6)}, {report.lon.toFixed(6)}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Shield size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">AI Confidence</span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-xl font-black text-slate-900">
                                            {(report.aiConfidence! * 100).toFixed(1)}%
                                        </p>
                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-1000", isAccepted ? "bg-emerald-500" : "bg-rose-500")}
                                                style={{ width: `${report.aiConfidence! * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Clock size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Narrative</span>
                                </div>
                                <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                                    "{report.description || "No narrative provided by operator."}"
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Timeline */}
                    <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-3">
                            <Calendar size={14} /> Propagation Timeline
                        </h3>
                        <ActivityTimeline entityId={report.id} />
                    </section>
                </div>

                {/* Tactical Sidebar */}
                <div className="space-y-8">
                    {isAccepted && pothole && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-700" />

                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Operations Link</h4>
                            <div className="space-y-2">
                                <p className="text-2xl font-black tracking-tighter">Live Deployment</p>
                                <p className="text-[11px] font-medium opacity-70">Report has been mapped to current infrastructure works.</p>
                            </div>

                            <div className="bg-white/10 rounded-2xl p-4 space-y-3 border border-white/10">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="opacity-60">Status</span>
                                    <span className="text-emerald-400">{pothole.status}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="opacity-60">Severity</span>
                                    <span>{pothole.severity}</span>
                                </div>
                            </div>

                            <Link
                                to={`/potholes/${pothole.id}`}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-xl active:scale-95"
                            >
                                <Navigation size={14} /> Public Map View
                            </Link>
                        </div>
                    )}

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Stats</h4>
                        <div className="space-y-4">
                            {[
                                { label: "Discovery Confidence", value: "92.4%", icon: Shield },
                                { label: "Sector Load", value: "Normal", icon: LinkIcon }
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <s.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{s.label}</p>
                                        <p className="text-xs font-black text-slate-900">{s.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportStatus;
