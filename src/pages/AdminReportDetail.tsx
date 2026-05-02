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
    Clock, 
    AlertCircle, 
    Save, 
    History,
    Shield,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Info,
    ArrowRight,
    ChevronRight
} from 'lucide-react';
import { PROVINCIAL_COUNCILS } from '../lib/provinceResolver';
import { Skeleton } from '../components/Skeleton';
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
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const [reportData, logsData] = await Promise.all([
                    reportsApi.getById(id),
                    auditLogsApi.list()
                ]);
                
                if (reportData) {
                    setReport(reportData);
                    setEditedProvince(reportData.provincialCouncil);
                    setEditedDistrict(reportData.district || '');
                    setEditedStatus(reportData.status);
                    
                    // Filter logs for this report
                    const reportLogs = logsData.filter(l => l.entityId === id);
                    setLogs(reportLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                }
            } catch (error) {
                console.error("Failed to load report details", error);
            } finally {
                setLoading(false);
            }
        };
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
            };
            
            // If there's a note, we might want to handle it separately or include it
            // For now, let's just update the report
            const updated = await reportsApi.update(id, updates);
            if (updated) {
                setReport(updated);
                // Reload logs to show the new edit
                const logsData = await auditLogsApi.list();
                const reportLogs = logsData.filter(l => l.entityId === id);
                setLogs(reportLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
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
            <div className="space-y-8 animate-pulse">
                <div className="h-8 w-64 bg-slate-100 rounded-lg" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[600px] bg-slate-100 rounded-[2.5rem]" />
                    <div className="h-[600px] bg-slate-100 rounded-[2.5rem]" />
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-black text-slate-900 uppercase">Report Not Found</h2>
                <button onClick={() => navigate('/admin/reports')} className="mt-4 text-blue-600 font-bold hover:underline">Return to all reports</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/reports')}
                        className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Report Analysis</h1>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-mono font-bold">{report.id}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Detailed evidence and governance oversight</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={cn(
                        "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border shadow-sm",
                        report.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        report.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                    )}>
                        {report.status}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details & Evidence */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Evidence Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-950 text-white rounded-xl shadow-lg">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Visual Evidence</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Citizen-submitted field imagery</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="relative rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-100 aspect-video group">
                                <img 
                                    src={report.imageUrl} 
                                    alt="Evidence" 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                    <div className="text-white">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Capture Location</p>
                                        <p className="text-sm font-bold">{report.district}, Sri Lanka</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordinates</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 font-mono tracking-tight">
                                        {report.lat.toFixed(6)}, {report.lon.toFixed(6)}
                                    </p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted By</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 truncate">{report.submittedBy}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900">{format(new Date(report.createdAt), 'dd MMM yyyy')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <History size={18} />
                                </div>
                                <div>
                                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Status Timeline</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historical audit of governance decisions</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                                {logs.length > 0 ? logs.map((log, idx) => (
                                    <div key={log.id} className="relative pl-10">
                                        <div className={cn(
                                            "absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm",
                                            idx === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                                        )}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                        </div>
                                        <div>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                                    {log.action.replace('_', ' ')}
                                                </h4>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {format(new Date(log.timestamp), 'dd MMM, HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 leading-relaxed">{log.details}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">By {log.actorName || log.actor}</span>
                                                {log.newStatus && (
                                                    <div className="flex items-center gap-1">
                                                        <ArrowRight size={10} className="text-slate-300" />
                                                        <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                                                            {log.newStatus}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <Info className="mx-auto text-slate-200 mb-2" size={32} />
                                        <p className="text-xs font-black text-slate-300 uppercase">No historical logs available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Admin Actions */}
                <div className="space-y-8 h-fit lg:sticky lg:top-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                            Governance Controls
                        </h3>

                        <div className="space-y-6">
                            {/* Province Edit */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Provincial Council</label>
                                <div className="relative">
                                    <select 
                                        value={editedProvince}
                                        onChange={(e) => setEditedProvince(e.target.value as any)}
                                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                    >
                                        {PROVINCIAL_COUNCILS.map(pc => (
                                            <option key={pc} value={pc}>{pc}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 rotate-90" size={14} />
                                </div>
                            </div>

                            {/* District Edit */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">District</label>
                                <input 
                                    type="text" 
                                    value={editedDistrict}
                                    onChange={(e) => setEditedDistrict(e.target.value)}
                                    placeholder="Enter district..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black text-slate-700 outline-none focus:bg-white transition-all"
                                />
                            </div>

                            {/* Status Update */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Global Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['New', 'Verified', 'In Progress', 'Completed', 'Rejected'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setEditedStatus(s as any)}
                                            className={cn(
                                                "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                editedStatus === s 
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10" 
                                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Admin Note */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Internal Annotation</label>
                                <textarea 
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Add notes for audit trail..."
                                    className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 outline-none focus:bg-white transition-all resize-none"
                                />
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? "Synchronizing..." : "Authorize Corrections"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/30">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="text-cyan-400" size={18} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Intake Intelligence</h4>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-6 uppercase tracking-tight">
                            Neural analysis has assigned this report to the <span className="text-white">{report.provincialCouncil}</span>. Corrections made here are logged as administrative overrides.
                        </p>
                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol V1.2</span>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                Secured
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReportDetail;
