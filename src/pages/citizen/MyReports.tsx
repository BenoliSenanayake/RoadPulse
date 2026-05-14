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
        <div className="max-w-5xl mx-auto px-6 py-16 pb-32 theme-citizen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-16">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold text-[#0F172A] tracking-tight">My Submissions</h1>
                    <p className="text-sm font-bold text-[#64748B] uppercase tracking-[0.15em]">Official infrastructure reporting history</p>
                </div>
                <Link
                    to="/citizen/report"
                    className="btn-premium btn-primary px-8 py-4 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <PlusCircle size={20} />
                    New Submission
                </Link>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 custom-scroll no-scrollbar">
                {FILTERS.map(item => {
                    const isActive = filter === item.key;
                    return (
                        <button
                            key={item.key}
                            onClick={() => setFilter(item.key)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border shadow-sm ${
                                isActive
                                    ? 'bg-[#4F6FAF] border-[#4F6FAF] text-white'
                                    : 'bg-white border-[#DCE3EE] text-[#64748B] hover:border-[#4F6FAF] hover:text-[#0F172A]'
                            }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-[#DCE3EE] shadow-sm">
                    <div className="w-12 h-12 border-4 border-[#EAF2FF] border-t-[#4F6FAF] rounded-full animate-spin mb-6" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#64748B]">Syncing records...</p>
                </div>
            ) : error ? (
                <div className="bg-white border border-[#DCE3EE] rounded-3xl p-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-[#0F172A] mb-3">Sync Failure</h3>
                    <p className="text-sm text-[#64748B] mb-8">{error}</p>
                    <button onClick={loadMyReports} className="px-10 py-4 bg-[#0F172A] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-black transition-all">Retry Synchronization</button>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#DCE3EE] p-24 text-center shadow-sm">
                    <div className="w-20 h-20 bg-[#F7F9FC] rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#94A3B8]">
                        <Inbox size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-[#0F172A] mb-4">
                        {filter === 'ALL' ? 'No reports found' : 'No matching reports'}
                    </h3>
                    <p className="text-base text-[#64748B] max-w-sm mx-auto mb-10">
                        {filter === 'ALL'
                            ? "You haven't submitted any road damage reports yet. Your contributions help improve city infrastructure."
                            : 'Adjust your filters to locate a specific report in your history.'}
                    </p>
                    {filter === 'ALL' && (
                        <Link
                            to="/citizen/report"
                            className="inline-flex items-center gap-2 px-10 py-4 bg-[#4F6FAF] text-white rounded-xl text-sm font-bold shadow-lg hover:bg-[#3E5C96] transition-all"
                        >
                            <PlusCircle size={20} /> Create First Report
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-5">
                    {filteredReports.map(report => (
                        <ReportRow key={report.id} report={report} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ReportRow = ({ report }: { report: CitizenReport }) => {
    const description = report.description?.replace(/^\[.*?\]\s*/, '') || 'Road Hazard Report';
    const locationLabel = `${report.lat.toFixed(4)}, ${report.lon.toFixed(4)}`;
    const dateStr = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true });

    return (
        <Link
            to={`/citizen/status/${report.id}`}
            className="flex items-center gap-6 bg-white rounded-2xl p-6 border border-[#DCE3EE] shadow-sm hover:border-[#4F6FAF] hover:shadow-xl transition-all group relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-[#4F6FAF] transition-all" />
            
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F7F9FC] shrink-0 border border-[#DCE3EE] transition-all group-hover:scale-[1.02] shadow-sm">
                <img src={report.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="text-lg font-bold text-[#0F172A] truncate group-hover:text-[#4F6FAF] transition-colors">{description}</p>
                    <StatusPill status={report.status} variant="citizen" className="shrink-0 scale-105 origin-right" />
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-[#64748B]">
                        <MapPin size={14} className="text-[#94A3B8]" /> {locationLabel}
                    </span>
                    <span className="flex items-center gap-2 text-xs font-bold text-[#64748B]">
                        <Clock size={14} className="text-[#94A3B8]" /> {dateStr}
                    </span>
                </div>
            </div>

            <div className="shrink-0 pl-4 hidden sm:block">
                <div className="w-12 h-12 rounded-xl bg-[#F7F9FC] flex items-center justify-center text-[#94A3B8] group-hover:bg-[#EAF2FF] group-hover:text-[#4F6FAF] transition-all border border-[#DCE3EE] group-hover:border-[#4F6FAF] shadow-sm">
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
};

export default MyReports;
