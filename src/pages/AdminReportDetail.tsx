import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    reportsApi, 
    auditLogsApi 
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
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                    <AlertCircle size={32} className="text-slate-200" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Telemetry Lost</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 mb-8">This report unit ID does not exist in the global record stream.</p>
                <button onClick={() => navigate('/admin/reports')} className="btn-premium bg-slate-900 text-white shadow-xl">Return to Records</button>
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
                        className="h-12 w-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
                    >
                        <ChevronLeft size={20} className="text-slate-600 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="section-heading leading-none">Report Analysis</h1>
                            <span className="px-2.5 py-1 bg-slate-900 text-blue-400 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-lg shadow-slate-900/10">#{report.id.split('-')[1]}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Unit telemetry & jurisdictional governance</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={loadData} className="btn-premium bg-white text-slate-600 border border-slate-100 shadow-sm">
                        <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                    </button>
                    <div className={cn(
                        "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border shadow-xl transition-all duration-500",
                        report.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5' :
                        report.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-500/5' :
                        'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-500/5'
                    )}>
                        {report.status}
                    </div>
                    {report.priority && (
                        <div className={cn(
                            "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border shadow-xl transition-all duration-500",
                            report.priority === 'Urgent' ? 'bg-rose-500 text-white border-rose-600 shadow-rose-500/20' :
                            report.priority === 'High' ? 'bg-orange-500 text-white border-orange-600 shadow-orange-500/20' :
                            report.priority === 'Medium' ? 'bg-blue-500 text-white border-blue-600 shadow-blue-500/20' :
                            'bg-slate-400 text-white border-slate-500 shadow-slate-500/20'
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
                    <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-950 text-white rounded-2xl shadow-xl">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Visual Evidence</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Citizen-submitted field imagery</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Maximize2 size={18} /></button>
                                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><ExternalLink size={18} /></button>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="relative rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 aspect-video group">
                                <img 
                                    src={report.imageUrl} 
                                    alt="Evidence" 
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-end p-10">
                                    <div className="text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Registered Coordinates</p>
                                        <p className="text-lg font-black tracking-tight">{report.district}, Sri Lanka</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                                <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-50 hover:bg-white hover:border-blue-100 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin size={14} className="text-blue-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coordinates</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900 font-mono tracking-tight">
                                        {report.lat.toFixed(6)}, {report.lon.toFixed(6)}
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-50 hover:bg-white hover:border-blue-100 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User size={14} className="text-indigo-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Submitter Identity</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{report.submittedBy}</p>
                                </div>
                                <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-50 hover:bg-white hover:border-blue-100 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar size={14} className="text-emerald-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Intake Date</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{format(new Date(report.createdAt), 'dd MMM yyyy')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Status Lifecycle</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historical audit of governance decisions</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10">
                            <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                                {logs.length > 0 ? logs.map((log, idx) => (
                                    <div key={log.id} className="relative pl-12 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className={cn(
                                            "absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-md transition-all duration-500",
                                            idx === 0 ? "bg-blue-600 text-white scale-110" : "bg-slate-200 text-slate-400"
                                        )}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                        </div>
                                        <div>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                                    {String(log.action ?? '').replace(/_/g, ' ')}
                                                </h4>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                                    {format(new Date(log.timestamp), 'dd MMM, HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">{log.details}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-4 w-4 rounded-md bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">{log.actorName?.charAt(0)}</div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.actorName || log.actor}</span>
                                                </div>
                                                {log.newStatus && (
                                                    <div className="flex items-center gap-2">
                                                        <ArrowRight size={10} className="text-slate-300" />
                                                        <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                                            {log.newStatus}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-4">
                                            <Info className="text-slate-200" size={32} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Zero historical logs detected</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Admin Actions */}
                <div className="space-y-8 h-fit lg:sticky lg:top-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Governance Controls
                        </h3>

                        <div className="space-y-8">
                            {/* Province Edit */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block px-1">Provincial Council Override</label>
                                <div className="relative group">
                                    <select 
                                        value={editedProvince}
                                        onChange={(e) => setEditedProvince(e.target.value as any)}
                                        className="w-full pl-5 pr-10 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer"
                                    >
                                        {PROVINCIAL_COUNCILS.map(pc => (
                                            <option key={pc} value={pc}>{pc}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={16} />
                                </div>
                            </div>

                            {/* District Edit */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block px-1">District Identifier</label>
                                <input 
                                    type="text" 
                                    value={editedDistrict}
                                    onChange={(e) => setEditedDistrict(e.target.value)}
                                    placeholder="Enter district identifier..."
                                    className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                />
                            </div>

                            {/* Priority Selector */}
                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block px-1">Maintenance Priority</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setEditedPriority(p as any)}
                                            className={cn(
                                                "py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                                editedPriority === p 
                                                    ? p === 'Urgent' ? 'bg-rose-600 text-white border-rose-600 shadow-xl' :
                                                      p === 'High' ? 'bg-orange-500 text-white border-orange-500 shadow-xl' :
                                                      p === 'Medium' ? 'bg-blue-600 text-white border-blue-600 shadow-xl' :
                                                      'bg-slate-600 text-white border-slate-600 shadow-xl'
                                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:border-slate-200"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status Update */}
                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block px-1">Global Lifecycle Status</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['New', 'Verified', 'In Progress', 'Completed', 'Rejected'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setEditedStatus(s as any)}
                                            className={cn(
                                                "py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                                editedStatus === s 
                                                    ? "bg-slate-950 text-white border-slate-950 shadow-xl shadow-slate-900/10 scale-[1.02]" 
                                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:border-slate-200"
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Admin Note */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block px-1">Audit Annotation</label>
                                <textarea 
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Add notes for the audit trail..."
                                    className="w-full h-36 p-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-600 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none custom-scrollbar uppercase tracking-tight"
                                />
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-5 bg-slate-950 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-2xl shadow-slate-950/20 flex items-center justify-center gap-3 disabled:opacity-50 group active:scale-[0.98]"
                            >
                                {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} className="group-hover:scale-110 transition-transform" />}
                                {saving ? "Synchronizing..." : "Authorize Corrections"}
                            </button>
                        </div>
                    </div>

                    {/* Intelligence Summary */}
                    <div className="bg-slate-950 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-slate-950/30 border border-white/5 relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
                            <Shield size={200} />
                        </div>
                        <div className="relative z-10 flex items-center gap-4 mb-6">
                            <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                <Shield className="text-blue-400" size={20} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Governance Metadata</h4>
                        </div>
                        <p className="relative z-10 text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight mb-8">
                            Unit <span className="text-white">#{report.id.split('-')[1]}</span> has been jurisdictionalized to the <span className="text-white">{report.provincialCouncil}</span>. Corrections made here are logged as permanent administrative overrides in the system audit stream.
                        </p>
                        <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol V2.4</span>
                            <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
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
