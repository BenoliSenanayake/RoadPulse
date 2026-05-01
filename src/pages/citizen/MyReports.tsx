import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowRight, Clock, Inbox, MapPin, PlusCircle } from 'lucide-react';
import { listCitizenReports } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { CitizenReport } from '../../types';

function friendlyStatus(report: CitizenReport): { label: string; color: string } {
    if (report.status === 'Discarded') return { label: 'Not Accepted', color: 'text-rose-700 bg-rose-50 border-rose-100' };
    if (report.aiStatus === 'ACCEPTED') return { label: 'In Progress', color: 'text-violet-700 bg-violet-50 border-violet-100' };
    return { label: 'Under Review', color: 'text-amber-700 bg-amber-50 border-amber-100' };
}

type FilterKey = 'ALL' | 'Under Review' | 'In Progress' | 'Not Accepted';

const FILTERS: FilterKey[] = ['ALL', 'Under Review', 'In Progress', 'Not Accepted'];

const MyReports = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [filter, setFilter] = useState<FilterKey>('ALL');

    useEffect(() => {
        if (!user) return;

        const mine = listCitizenReports({ citizenId: user.id });
        setReports(mine.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, [user]);

    const filteredReports = reports.filter(report => {
        if (filter === 'ALL') return true;
        return friendlyStatus(report).label === filter;
    });

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10 pb-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">My Reports</h1>
                    <p className="text-sm text-slate-500">Track the status of potholes you have reported.</p>
                </div>
                <Link
                    to="/citizen/report"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors shrink-0"
                >
                    <PlusCircle size={16} /> New Report
                </Link>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                {FILTERS.map(item => (
                    <button
                        key={item}
                        onClick={() => setFilter(item)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                            filter === item
                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                    >
                        {item === 'ALL' ? 'All Reports' : item}
                    </button>
                ))}
            </div>

            {filteredReports.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Inbox size={24} className="text-slate-300" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">
                        {filter === 'ALL' ? 'No reports yet' : `No ${filter.toLowerCase()} reports`}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6 leading-relaxed">
                        {filter === 'ALL'
                            ? "You have not submitted any reports yet."
                            : 'Try selecting a different filter above.'}
                    </p>
                    {filter === 'ALL' && (
                        <Link
                            to="/citizen/report"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors"
                        >
                            <PlusCircle size={16} /> Submit a Report
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
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
    const fullDate = format(new Date(report.createdAt), 'MMM d, yyyy h:mm a');

    return (
        <Link
            to={`/citizen/status/${report.id}`}
            className="flex items-center gap-4 bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group"
        >
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                <img src={report.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate mb-1">{description}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin size={11} /> {locationLabel}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400" title={fullDate}>
                        <Clock size={11} /> {dateStr}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <span className={`hidden sm:inline text-[11px] font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                    {status.label}
                </span>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
            </div>
        </Link>
    );
};

export default MyReports;
