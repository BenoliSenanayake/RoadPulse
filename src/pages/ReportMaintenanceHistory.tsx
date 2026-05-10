import { useEffect, useMemo, useState } from 'react';
import {
    History,
    Search,
    Filter,
    AlertTriangle,
    Clock,
    MapPin,
    Loader2,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportsApi, auditLogsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { getProvinceShortName, PROVINCE_DISTRICTS, normalizeProvince, canonicalizeProvince, normalizeDistrict } from '../lib/provinceResolver';
import {
    filterReportsForProvince,
    hasOfficerProvince,
    isOverdueReport,
    logStaffReportFilter,
    OFFICER_PROVINCE_MISSING
} from '../lib/staffReportFilters';
import { canonicalizeStatus } from '../lib/status';
import type { CitizenReport, AuditLog } from '../types';

interface LifecycleHistory {
    id: string;
    district: string;
    location: string;
    submitted: string;
    verified: string;
    inProgress: string;
    completed: string;
    overdue: boolean;
    status: string;
    priority: string;
    notes: string;
    lastUpdated: string;
}

const EMPTY_DATE = '-';

const ReportMaintenanceHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const province = user?.provincialCouncil;

    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [districtFilter, setDistrictFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            if (!hasOfficerProvince(province)) {
                setError(OFFICER_PROVINCE_MISSING);
                setLoading(false);
                return;
            }

            const staffProvince = normalizeProvince(province);
            console.log('[History Debug] Current User:', user?.email, staffProvince);

            const [reportData, logData] = await Promise.all([
                reportsApi.list(),
                auditLogsApi.list()
            ]);

            const filteredReports = filterReportsForProvince(reportData, province);
            console.log(`[History] Raw telemetry: ${reportData.length} reports.`);
            console.log(`[History] Filtered for ${staffProvince}: ${filteredReports.length} reports.`);
            logStaffReportFilter('Maintenance History', province, reportData, filteredReports);

            setReports(filteredReports);
            setAuditLogs(logData);
        } catch (fetchError) {
            console.error('Failed to load history data', fetchError);
            setError('Failed to load maintenance history. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [province]);

    const districts = useMemo(() => {
        const officerProvince = canonicalizeProvince(province);
        if (officerProvince !== 'Unassigned') {
            return ['All', ...(PROVINCE_DISTRICTS[officerProvince] || [])];
        }
        return ['All'];
    }, [province]);

    const historyItems = useMemo(() => {
        const items: LifecycleHistory[] = reports.map(report => {
            const logs = auditLogs.filter(log => log.entityId === report.id);
            const findDate = (actions: string[]) => logs.find(log => actions.includes(log.action))?.timestamp || EMPTY_DATE;

            const reportStatus = canonicalizeStatus(report.status);
            const reachedVerified = ['Verified', 'Scheduled', 'In Progress', 'Completed'].includes(reportStatus)
                || report.aiClassification === 'VERIFIED_POTHOLE';
            const reachedInProgress = ['In Progress', 'Completed'].includes(reportStatus);
            const reachedCompleted = reportStatus === 'Completed';

            const verifiedAt = reachedVerified
                ? findDate(['AI_ACCEPTED', 'MANUAL_ACCEPTED', 'STATUS_CHANGED'])
                : EMPTY_DATE;

            return {
                id: report.id,
                district: report.district || 'Unknown',
                location: report.description?.replace(/^\[.*?\]\s*/, '') || 'Reported Point',
                submitted: report.createdAt,
                verified: verifiedAt !== EMPTY_DATE ? verifiedAt : (reachedVerified ? report.createdAt : EMPTY_DATE),
                inProgress: reachedInProgress ? findDate(['REPAIR_STARTED', 'STATUS_CHANGED']) : EMPTY_DATE,
                completed: reachedCompleted ? findDate(['REPAIR_COMPLETED', 'STATUS_CHANGED']) : EMPTY_DATE,
                overdue: isOverdueReport(report),
                status: reportStatus,
                priority: report.priority || 'Medium',
                notes: report.maintenanceNotes || report.description || '',
                lastUpdated: report.updatedAt || report.createdAt,
            };
        });

        return items.filter(item => {
            const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase())
                || item.location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDistrict = districtFilter === 'All' || normalizeDistrict(item.district) === normalizeDistrict(districtFilter);
            const matchesStatus = statusFilter === 'All' || canonicalizeStatus(item.status as any) === statusFilter;
            const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;

            return matchesSearch && matchesDistrict && matchesStatus && matchesPriority;
        }).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }, [reports, auditLogs, searchTerm, districtFilter, statusFilter, priorityFilter]);

    if (error) {
        return (
            <div className="rounded-[2.5rem] border border-rose-100 bg-white p-12 text-center shadow-sm max-w-md mx-auto mt-10">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} className="text-rose-500" />
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Access Denied</h2>
                <p className="text-sm text-slate-500 font-bold mb-8">{error}</p>
                <button
                    onClick={() => navigate('/staff/login')}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20"
                >
                    Sign In Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-fade-in-up">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="section-heading mb-1">Maintenance History</h1>
                    <p className="text-sm font-bold text-slate-500">Lifecycle tracking for provincial infrastructure reports.</p>
                </div>
                {province && province !== 'Unassigned' && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                        <MapPin size={12} /> {getProvinceShortName(province)} Sector
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                        >
                            {districts.map(d => (
                                <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl">
                        <AlertTriangle size={14} className="text-slate-400" />
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                        >
                            <option value="All">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl">
                        <Clock size={14} className="text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="New">New</option>
                            <option value="Verified">Verified</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-100 bg-white">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-slate-300" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading history logs...</p>
                    </div>
                </div>
            ) : historyItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-white p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <History size={24} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">No history found</h3>
                    <p className="text-sm font-bold text-slate-400 max-w-xs">No reports have been recorded in this jurisdiction yet.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Report ID & District</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 text-center">Submitted</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 text-center">Verified</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 text-center">In Progress</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 text-center">Completed</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Current Status</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {historyItems.map((item) => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-slate-900">#{item.id.split('-')[1] || item.id}</span>
                                                {item.overdue && (
                                                    <span className="flex items-center gap-1 bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-rose-100 animate-pulse">
                                                        <AlertTriangle size={8} /> Overdue
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.district} District</span>
                                        </div>
                                    </td>
                                    <DateCell value={item.submitted} tone="default" />
                                    <DateCell value={item.verified} tone="verified" />
                                    <DateCell value={item.inProgress} tone="progress" />
                                    <DateCell value={item.completed} tone="completed" />
                                    <td className="px-6 py-5">
                                        <StatusPill status={item.status as any} />
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button
                                            onClick={() => navigate(`/staff/reports/${item.id}`)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                        >
                                            Details <Eye size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const DateCell = ({ value, tone }: { value: string; tone: 'default' | 'verified' | 'progress' | 'completed' }) => {
    const hasDate = value !== EMPTY_DATE;
    const color = tone === 'verified'
        ? 'text-emerald-600'
        : tone === 'progress'
            ? 'text-blue-600'
            : tone === 'completed'
                ? 'text-slate-900'
                : 'text-slate-600';

    return (
        <td className="px-6 py-5 text-center">
            <div className="flex flex-col items-center">
                <span className={cn('text-[11px] font-bold', hasDate ? color : 'text-slate-300')}>
                    {hasDate ? new Date(value).toLocaleDateString() : EMPTY_DATE}
                </span>
                {hasDate && (
                    <span className="text-[8px] font-black text-slate-400 uppercase">
                        {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        </td>
    );
};

export default ReportMaintenanceHistory;
