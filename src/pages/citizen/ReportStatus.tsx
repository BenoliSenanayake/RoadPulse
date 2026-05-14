import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportsApi } from '../../lib/api';
import { ArrowLeft, MapPin, Calendar, CheckCircle2, Clock, Wrench, CircleDot, XCircle, ShieldCheck, CalendarClock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import type { CitizenReport } from '../../types';
import { StatusPill } from '../../components/StatusPill';
import { cn } from '../../lib/utils';

interface TimelineStep {
    label: string;
    description: string;
    icon: React.ElementType;
    done: boolean;
    current: boolean;
}

function buildTimeline(report: CitizenReport): TimelineStep[] {
    const status = report.status;
    const isRejected = ['Rejected', 'Unable to Repair', 'Discarded', 'REJECTED'].includes(status);

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

    const verifiedReached = ['Verified', 'Scheduled', 'In Progress', 'Completed', 'VERIFIED_POTHOLE', 'ACCEPTED', 'Fixed'].includes(status);
    const scheduledReached = ['Scheduled', 'In Progress', 'Completed', 'Fixed'].includes(status);
    const inProgressReached = ['In Progress', 'Completed', 'Fixed'].includes(status);
    const completedReached = ['Completed', 'Fixed'].includes(status);

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
            done: status !== 'New' && status !== 'PENDING',
            current: status === 'New' || status === 'PENDING', 
        },
        {
            label: 'Verified',
            description: 'Damage confirmed by local division.',
            icon: ShieldCheck,
            done: verifiedReached,
            current: status === 'Verified' || status === 'VERIFIED_POTHOLE' || status === 'ACCEPTED',
        },
        {
            label: 'Scheduled',
            description: 'Repair work added to the queue.',
            icon: CalendarClock,
            done: scheduledReached,
            current: status === 'Scheduled',
        },
    ];

    if (inProgressReached || status === 'Scheduled' || status === 'In Progress') {
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
        current: status === 'Completed' || status === 'Fixed',
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
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to load report';
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        loadReport();
    }, [id]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center theme-citizen">
            <div className="w-10 h-10 border-2 border-slate-100 border-t-[var(--accent-solid)] rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing status...</p>
        </div>
    );

    if (error || !report) return (
        <div className="max-w-xl mx-auto p-12 text-center space-y-6 theme-citizen">
            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                <XCircle size={32} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Report Not Found</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
                {error || "We couldn't locate this specific report artifact. It may have been archived or deleted."}
            </p>
            <Link to="/citizen/my-reports" className="btn-premium btn-primary px-6 py-3">
                <ArrowLeft size={16} /> Back to My Reports
            </Link>
        </div>
    );

    const timeline = buildTimeline(report);
    const description = report.description ? report.description.replace(/^\[.*?\]\s*/, '') : 'Road Damage Report';
    const isRejected = ['Rejected', 'Unable to Repair', 'Discarded', 'REJECTED'].includes(report.status);

    return (
        <div className="max-w-2xl mx-auto px-4 py-12 pb-32 space-y-10 animate-fade-in theme-citizen">
            <Link
                to="/citizen/my-reports"
                className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-[var(--accent-text)] transition-colors group uppercase tracking-widest"
            >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                Back to Activity
            </Link>

            <div className="card-premium overflow-hidden border-slate-200/60 shadow-md">
                <div className="h-64 sm:h-80 w-full overflow-hidden bg-slate-50 relative group">
                    <img src={report.imageUrl} alt="Damage evidence" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Evidence Data</p>
                            <h1 className="text-xl font-semibold text-white tracking-tight leading-tight max-w-sm">
                                {description}
                            </h1>
                        </div>
                        <StatusPill status={report.status} variant="citizen" className="bg-white text-slate-900 border-none shadow-xl px-4 py-2 font-bold" />
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
                    <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[var(--accent-text)] shadow-sm shrink-0 border border-slate-100">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Location</p>
                            <p className="text-xs font-semibold text-slate-700 font-mono tracking-tight">{report.lat.toFixed(5)}, {report.lon.toFixed(5)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[var(--accent-text)] shadow-sm shrink-0 border border-slate-100">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Logged On</p>
                            <p className="text-xs font-semibold text-slate-700">{format(new Date(report.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-premium p-8 sm:p-12 border-slate-200/60 shadow-md">
                <div className="flex items-center justify-between mb-12">
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Repair Lifecycle</h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                        <Activity size={12} className="text-[var(--accent-text)] animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Monitoring</span>
                    </div>
                </div>

                {isRejected && (
                    <div className="flex items-start gap-4 mb-12 p-6 bg-red-50/50 border border-red-100 rounded-xl">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm shrink-0 border border-red-100">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-red-900 mb-1">Report Not Verified</p>
                            <p className="text-xs text-red-700/80 leading-relaxed font-medium">
                                Maintenance officers reviewed this submission and determined it does not meet our repair criteria or is a duplicate report.
                            </p>
                        </div>
                    </div>
                )}

                <div className="relative space-y-10 ml-4">
                    {timeline.map((step, idx) => {
                        const isLast = idx === timeline.length - 1;
                        const isActive = step.current;
                        const isDone = step.done;
                        
                        return (
                            <div key={step.label} className="flex gap-8 relative group">
                                {!isLast && (
                                    <div className={cn(
                                        "absolute left-[17px] top-10 w-[2px] h-10 transition-colors duration-500",
                                        isDone ? "bg-[var(--accent-solid)]" : "bg-slate-100"
                                    )} />
                                )}

                                <div className={cn(
                                    "relative z-10 flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 transition-all duration-300",
                                    isDone 
                                        ? "bg-[var(--accent-solid)] border-[var(--accent-solid)] text-white shadow-sm"
                                        : isActive
                                            ? "bg-white border-[var(--accent-solid)] text-[var(--accent-text)] shadow-md ring-4 ring-[var(--accent-bg)]"
                                            : "bg-white border-slate-100 text-slate-200"
                                )}>
                                    <step.icon size={16} />
                                </div>

                                <div className="space-y-1 pt-1">
                                    <div className="flex items-center gap-3">
                                        <p className={cn(
                                            "text-sm font-semibold uppercase tracking-wide transition-colors",
                                            isDone || isActive ? "text-slate-900" : "text-slate-300"
                                        )}>
                                            {step.label}
                                        </p>
                                        {isActive && (
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--accent-text)] bg-[var(--accent-bg)] px-2.5 py-0.5 rounded-full border border-[var(--accent-border)] animate-pulse">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn(
                                        "text-[11px] font-medium leading-relaxed transition-colors",
                                        isDone || isActive ? "text-slate-500" : "text-slate-300"
                                    )}>
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
                    className="btn-premium btn-secondary px-8 py-3 text-[10px]"
                >
                    Submit another report <ArrowLeft size={14} className="rotate-180" />
                </Link>
            </div>
        </div>
    );
};

export default ReportStatus;
