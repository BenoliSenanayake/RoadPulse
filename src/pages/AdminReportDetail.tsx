import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    reportsApi
} from '../lib/api';
import { 
    ChevronLeft, 
    MapPin, 
    User, 
    Calendar, 
    AlertCircle, 
    Save, 
    History,
    Shield,
    ArrowRight,
    ChevronDown,
    RefreshCw,
    Maximize2,
    ExternalLink,
    Info
} from 'lucide-react';
import { PROVINCIAL_COUNCILS } from '../lib/provinceResolver';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import type { CitizenReport, AuditLog, ProvincialCouncil } from '../types';
import { StatusPill, type StatusType } from '../components/StatusPill';

const AdminReportDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [report, setReport] = useState<CitizenReport | null>(null);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Editable fields
    const [editedProvince, setEditedProvince] = useState<ProvincialCouncil>('Unassigned');
    const [editedDistrict, setEditedDistrict] = useState('');
    const [editedStatus, setEditedStatus] = useState<CitizenReport['status']>('New');
    const [editedPriority, setEditedPriority] = useState<CitizenReport['priority']>('Medium');
    const [adminNote, setAdminNote] = useState('');

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [reportData, logsData] = await Promise.all([
                reportsApi.getById(id),
                reportsApi.getHistory(id)
            ]);
            
            if (reportData) {
                setReport(reportData);
                setEditedProvince(reportData.provincialCouncil || 'Unassigned');
                setEditedDistrict(reportData.district || '');
                setEditedStatus(reportData.status);
                setEditedPriority(reportData.priority || 'Medium');
                setLogs(logsData);
            }
        } catch (error) {
            console.error("Failed to load report details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleSave = async () => {
        if (!report || !id) return;
        setSaving(true);
        try {
            const updates: Partial<CitizenReport> = {
                provincialCouncil: editedProvince,
                district: editedDistrict,
                status: editedStatus,
                priority: editedPriority,
                maintenanceNotes: adminNote
            };
            
            const updated = await reportsApi.update(id, updates);
            if (updated) {
                setReport(updated);
                const logsData = await reportsApi.getHistory(id);
                setLogs(logsData);
                setAdminNote('');
            }
        } catch (error) {
            console.error("Failed to update report", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-10 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-100 rounded-2xl" />
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-slate-100 rounded-lg" />
                        <div className="h-3 w-32 bg-slate-50 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[600px] bg-slate-100 rounded-[2.5rem]" />
                    <div className="h-[600px] bg-slate-100 rounded-[2.5rem]" />
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle size={32} className="text-slate-300" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Record Not Found</h2>
                <p className="text-sm text-slate-500 mt-2 mb-8">This report ID does not exist in the system records.</p>
                <button onClick={() => navigate('/admin/reports')} className="btn-premium bg-slate-900 text-white">Return to Records</button>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/admin/reports')}
                        className="h-10 w-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm group"
                    >
                        <ChevronLeft size={18} className="text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Report Analysis</h1>
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100">ID: {report.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Unit verification & jurisdictional audit</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={loadData} className="p-2.5 bg-white text-slate-400 border border-slate-100 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
                        <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                    </button>
                    <StatusPill status={report.status as StatusType} />
                    {report.priority && (
                        <div className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm transition-all",
                            report.priority === 'Urgent' || report.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            report.priority === 'Medium' ? 'bg-slate-50 text-slate-500 border-slate-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                        )}>
                            {report.priority} PRIORITY
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details & Evidence */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Evidence Card */}
                    <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-white border border-slate-100 text-slate-400 rounded-lg shadow-sm">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Visual Evidence</h3>
                                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Citizen-submitted field imagery</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Maximize2 size={16} /></button>
                                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><ExternalLink size={16} /></button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100 aspect-video group shadow-sm">
                                <img 
                                    src={report.imageUrl} 
                                    alt="Evidence" 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                <div className="p-5 bg-slate-50/30 rounded-xl border border-slate-100 hover:bg-white hover:border-[var(--accent-border)] transition-all duration-300 shadow-sm group">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin size={14} className="text-slate-400 group-hover:text-[var(--accent-solid)]" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Coordinates</span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-900 font-mono tracking-tight">
                                        {report.lat.toFixed(6)}, {report.lon.toFixed(6)}
                                    </p>
                                </div>
                                <div className="p-5 bg-slate-50/30 rounded-xl border border-slate-100 hover:bg-white hover:border-[var(--accent-border)] transition-all duration-300 shadow-sm group">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User size={14} className="text-slate-400 group-hover:text-[var(--accent-solid)]" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Submitter</span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-900 truncate tracking-tight">{report.submittedBy}</p>
                                </div>
                                <div className="p-5 bg-slate-50/30 rounded-xl border border-slate-100 hover:bg-white hover:border-[var(--accent-border)] transition-all duration-300 shadow-sm group">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar size={14} className="text-slate-400 group-hover:text-[var(--accent-solid)]" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Created At</span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-900 tracking-tight">{format(new Date(report.createdAt), 'dd MMM yyyy')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Card */}
                    <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-white border border-slate-100 text-slate-400 rounded-lg shadow-sm">
                                    <History size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Status Lifecycle</h3>
                                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Historical audit of governance decisions</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-50">
                                {logs.length > 0 ? logs.map((log, idx) => (
                                    <div key={log.id} className="relative pl-10">
                                        <div className={cn(
                                            "absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm transition-all",
                                            idx === 0 ? "bg-[var(--accent-solid)] text-white scale-110" : "bg-slate-100 text-slate-300"
                                        )}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                        </div>
                                        <div>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                                <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                                                    {String(log.action ?? '').replace(/_/g, ' ')}
                                                </h4>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {format(new Date(log.timestamp), 'dd MMM, HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{log.details}</p>
                                            <div className="flex items-center gap-3 mt-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-5 w-5 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">{log.actorName?.charAt(0)}</div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{log.actorName || log.actor}</span>
                                                </div>
                                                {log.newStatus && (
                                                    <div className="flex items-center gap-2">
                                                        <ArrowRight size={10} className="text-slate-300" />
                                                        <span className="px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[9px] font-bold text-[var(--accent-text)] uppercase tracking-wider">
                                                            {log.newStatus}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 flex flex-col items-center">
                                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-4">
                                            <Info className="text-slate-300" size={24} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No audit history found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Admin Actions */}
                <div className="space-y-8 h-fit lg:sticky lg:top-8">
                    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-solid)]" />
                            Governance Controls
                        </h3>

                        <div className="space-y-6">
                            {/* Province Edit */}
                             <div className="space-y-2.5">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Provincial Jurisdiction</label>
                                 <div className="relative">
                                     <select 
                                         value={editedProvince}
                                         onChange={(e) => setEditedProvince(e.target.value as any)}
                                         className="w-full pl-4 pr-10 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-700 outline-none focus:bg-white focus:border-[var(--accent-border)] focus:ring-4 focus:ring-[var(--accent-bg)] transition-all appearance-none cursor-pointer"
                                     >
                                         {PROVINCIAL_COUNCILS.map(pc => (
                                             <option key={pc} value={pc}>{pc}</option>
                                         ))}
                                     </select>
                                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                                 </div>
                             </div>

                            {/* District Edit */}
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">District Identifier</label>
                                <input 
                                    type="text" 
                                    value={editedDistrict}
                                    onChange={(e) => setEditedDistrict(e.target.value)}
                                    placeholder="Enter sector ID..."
                                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-700 outline-none focus:bg-white focus:border-[var(--accent-border)] focus:ring-4 focus:ring-[var(--accent-bg)] transition-all"
                                />
                            </div>

                            {/* Priority Selector */}
                             <div className="space-y-3">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Operational Priority</label>
                                 <div className="grid grid-cols-2 gap-2">
                                     {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                         <button
                                             key={p}
                                             onClick={() => setEditedPriority(p as any)}
                                             className={cn(
                                                 "py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border shadow-sm",
                                                 editedPriority === p 
                                                     ? 'bg-slate-900 text-white border-slate-900'
                                                     : "bg-slate-50/50 text-slate-400 border-slate-100 hover:bg-white hover:border-slate-200"
                                             )}
                                         >
                                             {p}
                                         </button>
                                     ))}
                                 </div>
                             </div>

                            {/* Status Update */}
                             <div className="space-y-3">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Record Status</label>
                                 <div className="grid grid-cols-2 gap-2">
                                     {['New', 'Verified', 'In Progress', 'Completed', 'Rejected'].map(s => (
                                         <button
                                             key={s}
                                             onClick={() => setEditedStatus(s as any)}
                                             className={cn(
                                                 "py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border shadow-sm",
                                                 editedStatus === s 
                                                     ? "bg-[var(--accent-solid)] text-white border-[var(--accent-solid)]" 
                                                     : "bg-slate-50/50 text-slate-400 border-slate-100 hover:bg-white hover:border-slate-200"
                                             )}
                                         >
                                             {s}
                                         </button>
                                     ))}
                                 </div>
                             </div>

                            {/* Admin Note */}
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Audit Note</label>
                                <textarea 
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Brief reason for adjustment..."
                                    className="w-full h-24 p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-600 outline-none focus:bg-white focus:border-[var(--accent-border)] focus:ring-4 focus:ring-[var(--accent-bg)] transition-all resize-none custom-scrollbar"
                                />
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                                {saving ? "Updating..." : "Commit Changes"}
                            </button>
                        </div>
                    </div>

                    {/* Intelligence Summary */}
                     <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                            <Shield size={200} />
                        </div>
                        <div className="relative z-10 flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                                <Shield className="text-[var(--accent-solid)]" size={16} />
                            </div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">System Governance</h4>
                        </div>
                        <p className="relative z-10 text-[11px] font-medium text-slate-400 leading-relaxed tracking-tight mb-8">
                            Administrative overrides are permanently logged in the secure audit stream for record <span className="text-white font-bold">#{report.id.slice(0, 8)}</span>.
                        </p>
                        <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Auth Protocol 2.4</span>
                            <div className="flex items-center gap-2 text-[9px] font-bold text-[var(--accent-solid)] uppercase tracking-[0.1em]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-solid)] animate-pulse" />
                                SECURED
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReportDetail;
