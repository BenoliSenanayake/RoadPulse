import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportsApi } from '../../lib/api';
import { ArrowLeft, MapPin, Calendar, CheckCircle2, Clock, Wrench, CircleDot, XCircle, ShieldCheck, CalendarClock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { CitizenReport } from '../../types';
import { canonicalizeStatus } from '../../lib/status';

interface TimelineStep {
    label: string;
    description: string;
    icon: React.ElementType;
    done: boolean;
    current: boolean;
}

function buildTimeline(report: CitizenReport): TimelineStep[] {
    const status = canonicalizeStatus(report.status);
    const isRejected = status === 'Rejected';

    if (isRejected) {
        return [
            {
                label: 'Submitted',
                description: 'Your report was received by the system.',
                icon: CircleDot,
                done: true,
                current: false,
            },
            {
                label: 'Under Review',
                description: 'Maintenance officers reviewed the data.',
                icon: Clock,
                done: true,
                current: false,
            },
            {
                label: 'Not Accepted',
                description: 'This report could not be verified for repair.',
                icon: XCircle,
                done: true,
                current: true,
            }
        ];
    }

    const verifiedReached = ['Verified', 'Scheduled', 'In Progress', 'Completed'].includes(status);
    const scheduledReached = ['Scheduled', 'In Progress', 'Completed'].includes(status);
    const inProgressReached = ['In Progress', 'Completed'].includes(status);
    const completedReached = status === 'Completed';

    const steps: TimelineStep[] = [
        {
            label: 'Submitted',
            description: 'Report successfully logged.',
            icon: CircleDot,
            done: true,
            current: false, 
        },
        {
            label: 'Under Review',
            description: 'Officers are evaluating the damage.',
            icon: Clock,
            done: status !== 'New',
            current: status === 'New', 
        },
        {
            label: 'Verified',
            description: 'Damage confirmed by local division.',
            icon: ShieldCheck,
            done: verifiedReached,
            current: status === 'Verified',
        },
        {
            label: 'Scheduled',
            description: 'Repair work added to the queue.',
            icon: CalendarClock,
            done: scheduledReached,
            current: status === 'Scheduled',
        },
    ];

    if (inProgressReached || status === 'Scheduled') {
        steps.push({
            label: 'In Progress',
            description: 'Maintenance crew is on site.',
            icon: Wrench,
            done: inProgressReached,
            current: status === 'In Progress',
        });
    }

    steps.push({
        label: 'Fixed',
        description: 'Road damage has been repaired.',
        icon: CheckCircle2,
        done: completedReached,
        current: status === 'Completed',
    });

    return steps;
}

const ReportStatus = () => {
    const { id } = useParams();
    const [report, setReport] = useState<CitizenReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadReport = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const found = await reportsApi.getById(id);
                setReport(found);
            } catch (err: any) {
                setError(err.message || 'Failed to load report');
            } finally {
                setLoading(false);
            }
        };
        loadReport();
    }, [id]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Protocol...</p>
        </div>
    );

    if (error || !report) return (
        <div className="max-w-xl mx-auto p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-500 border border-rose-100">
                <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Report Not Found</h2>
            <p className="text-slate-500 text-sm font-medium">
                {error || "We couldn't locate this specific report artifact."}
            </p>
            <Link to="/citizen/my-reports" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">
                <ArrowLeft size={16} /> Back to My Reports
            </Link>
        </div>
    );

    const timeline = buildTimeline(report);
    const description = report.description ? report.description.replace(/^\[.*?\]\s*/, '') : 'Road Damage Report';
    
    let overallStatus = { label: 'Under Review', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    const s = canonicalizeStatus(report.status);
    if (s === 'Rejected') overallStatus = { label: 'Not Accepted', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    else if (s === 'Completed') overallStatus = { label: 'Fixed', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    else if (s === 'In Progress') overallStatus = { label: 'In Progress', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    else if (s === 'Scheduled') overallStatus = { label: 'Scheduled', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    else if (s === 'Verified') overallStatus = { label: 'Verified', color: 'text-violet-600 bg-violet-50 border-violet-200' };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-16 pb-32 space-y-8 animate-fade-in">
            <Link
                to="/citizen/my-reports"
                className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors group uppercase tracking-widest"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Activity
            </Link>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                <div className="h-64 sm:h-80 w-full overflow-hidden bg-slate-100 relative group">
                    <img src={report.imageUrl} alt="Damage evidence" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Live Evidence</p>
                            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight">
                                {description}
                            </h1>
                        </div>
                        <span className={`text-[10px] font-black px-4 py-2 rounded-full border uppercase tracking-widest backdrop-blur-md shadow-lg ${overallStatus.color.replace('bg-', 'bg-white/90 ')}`}>
                            {overallStatus.label}
                        </span>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white">
                    <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-inner">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-slate-100">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Global GPS</p>
                            <p className="text-xs font-bold text-slate-900 font-mono">{report.lat.toFixed(5)}, {report.lon.toFixed(5)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-inner">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-slate-100">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Submission</p>
                            <p className="text-xs font-bold text-slate-900">{format(new Date(report.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-900/5 p-8 sm:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lifecycle Track</h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                        <Activity size={12} className="text-blue-600 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Live Updates</span>
                    </div>
                </div>

                {s === 'Rejected' && (
                    <div className="flex items-start gap-4 mb-10 p-6 bg-rose-50 border border-rose-100 rounded-2xl relative z-10">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm shrink-0 border border-rose-100">
                            <XCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-rose-900 uppercase tracking-tight mb-1">Notice of Non-Action</p>
                            <p className="text-xs text-rose-600 leading-relaxed font-medium">
                                Our maintenance division reviewed this report and determined it cannot be accepted at this time. This may be due to image clarity, duplicate reporting, or non-road damage classification.
                            </p>
                        </div>
                    </div>
                )}

                <div className="relative space-y-12 ml-4 relative z-10">
                    {timeline.map((step, idx) => {
                        const isLast = idx === timeline.length - 1;
                        return (
                            <div key={step.label} className="flex gap-8 relative group">
                                {!isLast && (
                                    <div className={`absolute left-[19px] top-10 w-0.5 h-12 transition-all duration-700 ${
                                        step.done ? 'bg-blue-600' : 'bg-slate-100'
                                    }`} />
                                )}

                                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-2xl border-2 shrink-0 transition-all duration-500 ${
                                    step.done
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20'
                                        : step.current
                                            ? 'bg-white border-blue-500 text-blue-600 shadow-lg shadow-blue-100'
                                            : 'bg-white border-slate-100 text-slate-200'
                                }`}>
                                    <step.icon size={18} />
                                </div>

                                <div className="space-y-1 pt-1">
                                    <div className="flex items-center gap-3">
                                        <p className={`text-sm font-black uppercase tracking-tight ${
                                            step.done ? 'text-slate-900' : step.current ? 'text-blue-600' : 'text-slate-300'
                                        }`}>
                                            {step.label}
                                        </p>
                                        {step.current && (
                                            <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-[11px] font-bold leading-relaxed ${
                                        step.done || step.current ? 'text-slate-500' : 'text-slate-300'
                                    }`}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="text-center pt-8">
                <Link
                    to="/citizen/report"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                    New Submission <ArrowLeft size={14} className="rotate-180" />
                </Link>
            </div>
        </div>
    );
};

export default ReportStatus;
