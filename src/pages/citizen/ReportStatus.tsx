import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listCitizenReports } from '../../lib/api';
import { ArrowLeft, MapPin, Calendar, CheckCircle2, Clock, Wrench, CircleDot } from 'lucide-react';
import { format } from 'date-fns';
import type { CitizenReport } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TimelineStep {
    label: string;
    description: string;
    icon: React.ElementType;
    done: boolean;
    current: boolean;
}

/**
 * Build a simple 4-step timeline based on fields that actually exist
 * on CitizenReport (status: 'New'|'Discarded', aiStatus: 'PENDING'|'ACCEPTED'|'REJECTED').
 *
 * Mapping:
 *   Submitted  – always done
 *   Under Review – done when aiStatus !== 'PENDING'
 *   Repair Scheduled – done when aiStatus === 'ACCEPTED'
 *   Fixed – not derivable from CitizenReport alone; kept as future state
 */
function buildTimeline(report: CitizenReport): TimelineStep[] {
    const submitted = true;
    const reviewed  = report.aiStatus !== 'PENDING';
    const accepted  = report.aiStatus === 'ACCEPTED';

    return [
        {
            label: 'Submitted',
            description: 'Your report was received and is being processed by our team.',
            icon: CircleDot,
            done: submitted,
            current: submitted && !reviewed,
        },
        {
            label: 'Under Review',
            description: 'Our team is reviewing your report and verifying the location.',
            icon: Clock,
            done: reviewed,
            current: reviewed && !accepted,
        },
        {
            label: 'Repair Scheduled',
            description: 'A maintenance crew has been assigned and a repair date is set.',
            icon: Wrench,
            done: accepted,
            current: accepted,
        },
        {
            label: 'Fixed',
            description: 'The pothole has been repaired. Thank you for helping improve our roads!',
            icon: CheckCircle2,
            done: false,
            current: false,
        },
    ];
}

const ReportStatus = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [report, setReport] = useState<CitizenReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || !user) return;
        const all = listCitizenReports();
        const found = all.find(r => r.id === id && r.citizenId === user.id) ?? null;
        setReport(found);
        setLoading(false);
    }, [id, user]);

    if (loading) return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
    );

    if (!report) return (
        <div className="max-w-xl mx-auto p-12 text-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Report Not Found</h2>
            <p className="text-slate-500 text-sm">We couldn't find this report. It may have been removed.</p>
            <Link to="/citizen/my-reports" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:underline">
                <ArrowLeft size={16} /> Back to My Reports
            </Link>
        </div>
    );

    const timeline = buildTimeline(report);
    const description = report.description ? report.description.replace(/^\[.*?\]\s*/, '') : null;
    const locationLabel = `${report.lat.toFixed(5)}, ${report.lon.toFixed(5)}`;
    const submittedDate = format(new Date(report.createdAt), 'MMMM d, yyyy');

    // Friendly overall status badge
    let overallStatus = { label: 'Under Review', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (report.status === 'Discarded' || report.aiStatus === 'REJECTED') {
        overallStatus = { label: 'Not Accepted', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    } else if (report.aiStatus === 'ACCEPTED') {
        overallStatus = { label: 'Repair Scheduled', color: 'text-violet-700 bg-violet-50 border-violet-200' };
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 pb-24 space-y-6">
            {/* Back */}
            <Link
                to="/citizen/my-reports"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-900 transition-colors group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                My Reports
            </Link>

            {/* Report Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Image */}
                {report.imageUrl && (
                    <div className="h-52 sm:h-64 w-full overflow-hidden bg-slate-100">
                        <img src={report.imageUrl} alt="Reported pothole" className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="p-6 sm:p-8 space-y-6">
                    {/* Title + Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 mb-1">
                                {description || 'Road Damage Report'}
                            </h1>
                            <p className="text-xs text-slate-400 font-mono">
                                Report #{report.id.split('-')[0].toUpperCase()}
                            </p>
                        </div>
                        <span className={`self-start text-sm font-semibold px-3 py-1.5 rounded-full border ${overallStatus.color}`}>
                            {overallStatus.label}
                        </span>
                    </div>

                    {/* Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <MapPin size={17} className="text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                                <p className="text-sm font-medium text-slate-700 font-mono">{locationLabel}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <Calendar size={17} className="text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Submitted on</p>
                                <p className="text-sm font-medium text-slate-700">{submittedDate}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-base font-bold text-slate-900 mb-6">Report Progress</h2>
                <ol className="relative space-y-0">
                    {timeline.map((step, idx) => {
                        const isLast = idx === timeline.length - 1;
                        return (
                            <li key={step.label} className="flex gap-4 relative">
                                {/* Connector line */}
                                {!isLast && (
                                    <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${step.done ? 'bg-emerald-300' : 'bg-slate-100'}`} />
                                )}

                                {/* Icon */}
                                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 mt-0.5 transition-all ${
                                    step.done
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : step.current
                                            ? 'bg-white border-blue-400 text-blue-500 shadow-sm shadow-blue-100'
                                            : 'bg-white border-slate-200 text-slate-300'
                                }`}>
                                    <step.icon size={15} />
                                </div>

                                {/* Content */}
                                <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                                    <p className={`text-sm font-semibold mb-0.5 ${
                                        step.done ? 'text-slate-900' : step.current ? 'text-blue-700' : 'text-slate-400'
                                    }`}>
                                        {step.label}
                                        {step.current && (
                                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </p>
                                    <p className={`text-xs leading-relaxed ${step.done || step.current ? 'text-slate-500' : 'text-slate-300'}`}>
                                        {step.description}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>

            {/* Footer */}
            <div className="text-center pt-2">
                <Link
                    to="/citizen/report"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors"
                >
                    Report another pothole <ArrowLeft size={14} className="rotate-180" />
                </Link>
            </div>
        </div>
    );
};

export default ReportStatus;
