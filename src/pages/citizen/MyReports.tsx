import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock, Inbox, MapPin, PlusCircle, AlertTriangle } from 'lucide-react';
import { reportsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { CitizenReport } from '../../types';
import { canonicalizeStatus } from '../../lib/status';

function friendlyStatus(report: CitizenReport): { label: string; color: string } {
    const status = canonicalizeStatus(report.status);
    if (status === 'Rejected') return { label: 'Not Accepted', color: 'text-rose-700 bg-rose-50 border-rose-100' };
    if (status === 'Completed') return { label: 'Fixed', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
    if (status === 'In Progress') return { label: 'Repair In Progress', color: 'text-blue-700 bg-blue-50 border-blue-100' };
    if (status === 'Scheduled') return { label: 'Repair Scheduled', color: 'text-orange-700 bg-orange-50 border-orange-100' };
    if (status === 'Verified') return { label: 'Verified', color: 'text-violet-700 bg-violet-50 border-violet-100' };
    return { label: 'Under Review', color: 'text-amber-700 bg-amber-50 border-amber-100' };
}

type FilterKey = 'ALL' | 'Under Review' | 'Verified' | 'Repair Scheduled' | 'Repair In Progress' | 'Fixed' | 'Not Accepted';

const FILTERS: FilterKey[] = ['ALL', 'Under Review', 'Verified', 'Repair Scheduled', 'Repair In Progress', 'Fixed', 'Not Accepted'];

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
        } catch (err: any) {
            console.error('[MyReports] Failed to load reports:', err);
            setError(`Could not sync with the database: ${err.message || 'Unknown error'}`);
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
        return friendlyStatus(report).label === filter;
    });

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 pb-32">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">My Reports</h1>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Track your reported road issues</p>
                </div>
                <Link
                    to="/citizen/report"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 shrink-0 uppercase tracking-widest"
                >
                    <PlusCircle size={18} /> New Report
                </Link>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
                {FILTERS.map(item => (
                    <button
                        key={item}
                        onClick={() => setFilter(item)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                            filter === item
                                ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                        }`}
                    >
                        {item === 'ALL' ? 'All Reports' : item}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing with database...</p>
                </div>
            ) : error ? (
                <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-12 text-center">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest mb-2">Sync Error</h3>
                    <p className="text-xs font-bold text-rose-600 mb-8">{error}</p>
                    <button onClick={loadMyReports} className="px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20">Retry Sync</button>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5 p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                        <Inbox size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                        {filter === 'ALL' ? 'No reports yet' : `No ${filter.toLowerCase()} reports`}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto mb-10 font-bold uppercase tracking-tight">
                        {filter === 'ALL'
                            ? "You haven't flagged any road damage yet."
                            : 'Try adjusting your filters above.'}
                    </p>
                    {filter === 'ALL' && (
                        <Link
                            to="/citizen/report"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-xl shadow-slate-900/20 uppercase tracking-widest"
                        >
                            <PlusCircle size={18} /> Submit a Report
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
    const status = friendlyStatus(report);
    const description = report.description?.replace(/^\[.*?\]\s*/, '') || 'Road Damage Report';
    const locationLabel = `${report.lat.toFixed(4)}, ${report.lon.toFixed(4)}`;
    const dateStr = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true });

    return (
        <Link
            to={`/citizen/status/${report.id}`}
            className="flex items-center gap-4 bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-900/5 hover:border-blue-200 transition-all group animate-fade-in-up"
        >
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-inner group-hover:scale-105 transition-transform duration-500">
                <img src={report.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Report Artifact</p>
                <p className="text-base font-black text-slate-900 truncate mb-2 group-hover:text-blue-600 transition-colors">{description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                        <MapPin size={12} className="text-blue-500" /> {locationLabel}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                        <Clock size={12} className="text-blue-500" /> {dateStr}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 px-2">
                <span className={`hidden sm:inline text-[10px] font-black px-4 py-2 rounded-full border uppercase tracking-widest ${status.color}`}>
                    {status.label}
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <ArrowRight size={20} />
                </div>
            </div>
        </Link>
    );
};

export default MyReports;
