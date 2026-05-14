import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock, Inbox, MapPin, PlusCircle, AlertTriangle } from 'lucide-react';
import { reportsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { CitizenReport } from '../../types';
import { StatusPill } from '../../components/StatusPill';

type FilterKey = 'ALL' | 'PENDING' | 'NEEDS_MANUAL_REVIEW' | 'VERIFIED_POTHOLE' | 'Scheduled' | 'Completed' | 'Rejected';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'ALL', label: 'All Reports' },
    { key: 'PENDING', label: 'Submitted' },
    { key: 'NEEDS_MANUAL_REVIEW', label: 'Under Review' },
    { key: 'VERIFIED_POTHOLE', label: 'Verified' },
    { key: 'Scheduled', label: 'Scheduled' },
    { key: 'Completed', label: 'Fixed' },
    { key: 'Rejected', label: 'Rejected' },
];

const MyReports = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<FilterKey>('ALL');

    const loadMyReports = useCallback(async () => {
        if (!user) return;
        
        try {
            const response = await reportsApi.list({ citizenId: user.id, limit: 100 });
            const mine = response.data || [];
            setReports(mine.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setError('');
        } catch (err: unknown) {
            console.error('[MyReports] Failed to load reports:', err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(`Could not sync with the database: ${message}`);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadMyReports();
        const interval = setInterval(loadMyReports, 30000);
        return () => clearInterval(interval);
    }, [loadMyReports]);

    const filteredReports = reports.filter(report => {
        if (filter === 'ALL') return true;
        if (filter === 'Scheduled' && (report.status === 'Scheduled' || report.status === 'In Progress')) return true;
        if (filter === 'Completed' && (report.status === 'Completed' || report.status === 'Fixed')) return true;
        if (filter === 'Rejected' && (report.status === 'Rejected' || report.status === 'Unable to Repair' || report.status === 'Discarded')) return true;
        return report.status === filter;
    });

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 pb-32 theme-citizen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">My Reports</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administrative record of your submissions</p>
                </div>
                <Link
                    to="/citizen/report"
                    className="btn-premium btn-primary px-6 py-3 shadow-sm"
                >
                    <PlusCircle size={16} /> New Report
                </Link>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 custom-scroll">
                {FILTERS.map(item => (
                    <button
                        key={item.key}
                        onClick={() => setFilter(item.key)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
                            filter === item.key
                                ? 'bg-[var(--accent-solid)] border-[var(--accent-solid)] text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing database...</p>
                </div>
            ) : error ? (
                <div className="bg-white border border-slate-100 rounded-xl p-12 text-center shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Sync Error</h3>
                    <p className="text-xs text-slate-500 mb-6">{error}</p>
                    <button onClick={loadMyReports} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">Retry Sync</button>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <Inbox size={24} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {filter === 'ALL' ? 'No reports yet' : 'No matching reports'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mb-8">
                        {filter === 'ALL'
                            ? "You haven't submitted any road damage reports yet."
                            : 'Try adjusting your filters to find your report.'}
                    </p>
                    {filter === 'ALL' && (
                        <Link
                            to="/citizen/report"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 transition-all"
                        >
                            <PlusCircle size={16} /> Submit a Report
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredReports.map(report => (
                        <ReportRow key={report.id} report={report} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ReportRow = ({ report }: { report: CitizenReport }) => {
    const description = report.description?.replace(/^\[.*?\]\s*/, '') || 'Road Damage Report';
    const locationLabel = `${report.lat.toFixed(4)}, ${report.lon.toFixed(4)}`;
    const dateStr = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true });

    return (
        <Link
            to={`/citizen/status/${report.id}`}
            className="flex items-center gap-4 bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:border-[var(--accent-border)] hover:shadow-md transition-all group"
        >
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-50 transition-transform group-hover:scale-105">
                <img src={report.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1.5">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-black transition-colors">{description}</p>
                    <StatusPill status={report.status} variant="citizen" className="shrink-0 scale-[0.9] origin-right" />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                        <MapPin size={10} className="text-slate-300" /> {locationLabel}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                        <Clock size={10} className="text-slate-300" /> {dateStr}
                    </span>
                </div>
            </div>

            <div className="shrink-0 pl-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[var(--accent-bg)] group-hover:text-[var(--accent-text)] transition-all border border-transparent group-hover:border-[var(--accent-border)]">
                    <ArrowRight size={16} />
                </div>
            </div>
        </Link>
    );
};

export default MyReports;
