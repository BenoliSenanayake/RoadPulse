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
            <div className="w-12 h-12 border-4 border-[#EAF2FF] border-t-[#4F6FAF] rounded-full animate-spin mb-6" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#64748B]">Retrieving status data...</p>
        </div>
    );

    if (error || !report) return (
        <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-8 theme-citizen">
            <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500 border border-rose-100">
                <XCircle size={40} />
            </div>
            <div className="space-y-3">
                <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Record Not Found</h2>
                <p className="text-[#64748B] text-base leading-relaxed">
                    {error || "The requested report identifier does not match any records in our administrative database."}
                </p>
            </div>
            <Link to="/citizen/my-reports" className="btn-premium btn-primary px-8 py-4 shadow-lg inline-flex items-center gap-3">
                <ArrowLeft size={20} /> Return to Submissions
            </Link>
        </div>
    );

    const timeline = buildTimeline(report);
    const description = report.description ? report.description.replace(/^\[.*?\]\s*/, '') : 'Road Hazard Report';
    const isRejected = ['Rejected', 'Unable to Repair', 'Discarded', 'REJECTED'].includes(report.status);

    return (
        <div className="max-w-3xl mx-auto px-6 py-16 pb-32 space-y-12 theme-citizen">
            <Link
                to="/citizen/my-reports"
                className="inline-flex items-center gap-2.5 text-xs font-bold text-[#64748B] hover:text-[#4F6FAF] transition-colors group uppercase tracking-widest"
            >
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                Back to My Submissions
            </Link>

            <div className="card-premium overflow-hidden border-[#DCE3EE] shadow-xl">
                <div className="h-72 sm:h-96 w-full overflow-hidden bg-[#F7F9FC] relative group">
                    <img src={report.imageUrl} alt="Damage evidence" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">Verified Evidence</p>
                            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight max-w-lg">
                                {description}
                            </h1>
                        </div>
                        <StatusPill status={report.status} variant="citizen" className="bg-white text-[#0F172A] border-none shadow-2xl px-6 py-3 font-bold text-sm" />
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white border-t border-[#DCE3EE]">
                    <div className="flex items-start gap-5 p-5 bg-[#F7F9FC] rounded-2xl border border-[#DCE3EE]">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#4F6FAF] shadow-sm shrink-0 border border-[#DCE3EE]">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] mb-1.5">Coordinates</p>
                            <p className="text-sm font-bold text-[#0F172A] font-mono">{report.lat.toFixed(6)}, {report.lon.toFixed(6)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-5 p-5 bg-[#F7F9FC] rounded-2xl border border-[#DCE3EE]">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#4F6FAF] shadow-sm shrink-0 border border-[#DCE3EE]">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] mb-1.5">Submission Date</p>
                            <p className="text-sm font-bold text-[#0F172A]">{format(new Date(report.createdAt), 'MMMM d, yyyy')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-premium p-10 sm:p-16 border-[#DCE3EE] shadow-xl bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4F6FAF]" />
                <div className="flex items-center justify-between mb-16">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Service Lifecycle</h2>
                        <p className="text-sm text-[#64748B]">Real-time infrastructure maintenance monitoring</p>
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-[#EAF2FF] rounded-xl border border-[#DCE3EE] shadow-sm">
                        <Activity size={16} className="text-[#4F6FAF] animate-pulse" />
                        <span className="text-[11px] font-bold text-[#4F6FAF] uppercase tracking-widest">Live Sync</span>
                    </div>
                </div>

                {isRejected && (
                    <div className="flex items-start gap-6 mb-16 p-8 bg-rose-50 border border-rose-100 rounded-2xl">
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm shrink-0 border border-rose-200">
                            <XCircle size={28} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-bold text-[#0F172A]">Review Decision: Not Accepted</p>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Our administrative officers have reviewed this submission. It has been determined that this report does not meet our maintenance criteria at this time or is a duplicate entry.
                            </p>
                        </div>
                    </div>
                )}

                <div className="relative space-y-12 ml-6 sm:ml-8">
                    {timeline.map((step, idx) => {
                        const isLast = idx === timeline.length - 1;
                        const isActive = step.current;
                        const isDone = step.done;
                        
                        return (
                            <div key={step.label} className="flex gap-10 relative">
                                {!isLast && (
                                    <div className={cn(
                                        "absolute left-[21px] top-12 w-[3px] h-12 transition-all duration-700",
                                        isDone ? "bg-[#4F6FAF]" : "bg-[#F1F5F9]"
                                    )} />
                                )}

                                <div className={cn(
                                    "relative z-10 flex items-center justify-center w-11 h-11 rounded-xl border-2 shrink-0 transition-all duration-500",
                                    isDone 
                                        ? "bg-[#4F6FAF] border-[#4F6FAF] text-white shadow-lg"
                                        : isActive
                                            ? "bg-white border-[#4F6FAF] text-[#4F6FAF] shadow-xl ring-[6px] ring-[#EAF2FF]"
                                            : "bg-white border-[#F1F5F9] text-[#CBD5E1]"
                                )}>
                                    <step.icon size={22} className={isActive ? "animate-pulse" : ""} />
                                </div>

                                <div className="space-y-2 pt-1.5">
                                    <div className="flex items-center gap-4">
                                        <p className={cn(
                                            "text-base font-bold uppercase tracking-wider transition-colors",
                                            isDone || isActive ? "text-[#0F172A]" : "text-[#94A3B8]"
                                        )}>
                                            {step.label}
                                        </p>
                                        {isActive && (
                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white bg-[#4F6FAF] px-3 py-1 rounded-lg shadow-md">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn(
                                        "text-sm leading-relaxed transition-colors",
                                        isDone || isActive ? "text-[#64748B]" : "text-[#CBD5E1]"
                                    )}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-center pt-4">
                <Link
                    to="/citizen/report"
                    className="btn-premium btn-secondary px-10 py-4 shadow-sm text-sm font-bold flex items-center gap-3"
                >
                    <ArrowLeft size={20} className="rotate-180" />
                    Submit Another Report
                </Link>
            </div>
        </div>
    );
};

export default ReportStatus;
