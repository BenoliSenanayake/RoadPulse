import { useEffect, useMemo, useState } from 'react';
import { 
    History, 
    Search, 
    Filter, 
    ChevronRight, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    MapPin, 
    Calendar,
    ArrowRight,
    Loader2,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { potholesApi, reportsApi, auditLogsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { getProvinceShortName, PROVINCE_DISTRICTS } from '../lib/provinceResolver';
import type { CitizenReport, PotholeEvent, AuditLog, PotholeStatus, RepairPriority } from '../types';

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
    potholeId?: string;
}

const ReportMaintenanceHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [districtFilter, setDistrictFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pData, rData, aData] = await Promise.all([
                potholesApi.list(),
                reportsApi.list(),
                auditLogsApi.list()
            ]);
            
            // Provincial Siloing
            const filteredP = (province && province !== 'Unassigned') 
                ? pData.filter(p => p.provincialCouncil === province)
                : pData;
            const filteredR = (province && province !== 'Unassigned')
                ? rData.filter(r => r.provincialCouncil === province)
                : rData;
            
            setPotholes(filteredP);
            setReports(filteredR);
            setAuditLogs(aData);
        } catch (error) {
            console.error("Failed to load history data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [province]);

    const districts = useMemo(() => {
        if (province && province !== 'Unassigned') {
            return ['All', ...(PROVINCE_DISTRICTS[province] || [])];
        }
        return ['All'];
    }, [province]);

    const historyItems = useMemo(() => {
        // Map reports and potholes into a unified history format
        const items: LifecycleHistory[] = [];

        // Track seen pothole IDs to avoid duplicates if they have linked reports
        const seenPotholes = new Set<string>();

        // Process Potholes (Primary source for maintenance history)
        potholes.forEach(p => {
            const logs = auditLogs.filter(l => l.entityId === p.id);
            
            const findDate = (actions: string[]) => {
                const log = logs.find(l => actions.includes(l.action));
                return log ? log.timestamp : '—';
            };

            const submittedAt = p.timestamp || p.createdAt;
            const verifiedAt = p.status !== 'New' ? findDate(['AI_ACCEPTED', 'MANUAL_ACCEPTED', 'STATUS_CHANGED']) : '—';
            const inProgressAt = ['In Progress', 'Completed', 'Fixed'].includes(p.status) ? findDate(['REPAIR_STARTED', 'STATUS_CHANGED']) : '—';
            const completedAt = ['Completed', 'Fixed'].includes(p.status) ? findDate(['REPAIR_COMPLETED', 'STATUS_CHANGED']) : '—';

            // Overdue logic: >14 days and still New/Verified
            const ageInDays = Math.floor((new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = ['New', 'Verified', 'Confirmed'].includes(p.status) && ageInDays > 14;

            items.push({
                id: p.id,
                district: p.district || 'Unknown',
                location: p.roadName || 'Coordinate Location',
                submitted: submittedAt,
                verified: verifiedAt !== '—' ? verifiedAt : (p.status !== 'New' ? submittedAt : '—'),
                inProgress: inProgressAt,
                completed: completedAt,
                overdue: isOverdue,
                status: p.status,
                priority: p.priority || 'Medium',
                notes: p.maintenanceNotes || '',
                lastUpdated: p.updatedAt || p.createdAt,
                potholeId: p.id
            });
            seenPotholes.add(p.id);
        });

        // Process Reports that haven't been converted to potholes yet (Rejected or Pending)
        reports.forEach(r => {
            if (r.linkedPotholeId && seenPotholes.has(r.linkedPotholeId)) return;

            const logs = auditLogs.filter(l => l.entityId === r.id);
            const submittedAt = r.createdAt;
            
            items.push({
                id: r.id,
                district: r.district || 'Unknown',
                location: 'Reported Point',
                submitted: submittedAt,
                verified: r.aiStatus === 'ACCEPTED' ? submittedAt : '—',
                inProgress: '—',
                completed: '—',
                overdue: false,
                status: r.aiStatus === 'PENDING' ? 'PENDING' : r.aiStatus,
                priority: 'Low',
                notes: r.description || '',
                lastUpdated: r.createdAt,
            });
        });

        // Filter
        return items.filter(item => {
            const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                item.location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDistrict = districtFilter === 'All' || item.district === districtFilter;
            const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
            
            return matchesSearch && matchesDistrict && matchesStatus;
        }).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }, [potholes, reports, auditLogs, searchTerm, districtFilter, statusFilter]);

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
                        <Clock size={14} className="text-slate-400" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Verified">Verified</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="PENDING">Manual Review</option>
                            <option value="REJECTED">Rejected</option>
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
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[11px] font-bold text-slate-600">{item.submitted !== '—' ? new Date(item.submitted).toLocaleDateString() : '—'}</span>
                                            {item.submitted !== '—' && <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(item.submitted).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={cn("text-[11px] font-bold", item.verified !== '—' ? "text-emerald-600" : "text-slate-300")}>
                                                {item.verified !== '—' ? new Date(item.verified).toLocaleDateString() : '—'}
                                            </span>
                                            {item.verified !== '—' && <span className="text-[8px] font-black text-emerald-400 uppercase">{new Date(item.verified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={cn("text-[11px] font-bold", item.inProgress !== '—' ? "text-blue-600" : "text-slate-300")}>
                                                {item.inProgress !== '—' ? new Date(item.inProgress).toLocaleDateString() : '—'}
                                            </span>
                                            {item.inProgress !== '—' && <span className="text-[8px] font-black text-blue-400 uppercase">{new Date(item.inProgress).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={cn("text-[11px] font-bold", item.completed !== '—' ? "text-slate-900" : "text-slate-300")}>
                                                {item.completed !== '—' ? new Date(item.completed).toLocaleDateString() : '—'}
                                            </span>
                                            {item.completed !== '—' && <span className="text-[8px] font-black text-slate-500 uppercase">{new Date(item.completed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusPill status={item.status as any} />
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button 
                                            onClick={() => navigate(item.potholeId ? `/potholes/${item.potholeId}` : `/staff/overview`)}
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

export default ReportMaintenanceHistory;
