import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Save,
    ShieldCheck,
    Activity,
    Clock,
    User,
    Brain,
    ImageIcon,
    Maximize2,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Info,
    Play,
    CalendarClock
} from 'lucide-react';
import { reportsApi } from '../lib/api';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { getProvinceShortName, normalizeProvince } from '../lib/provinceResolver';
import { hasOfficerProvince, OFFICER_PROVINCE_MISSING } from '../lib/staffReportFilters';
import { canonicalizeStatus } from '../lib/status';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import type { CitizenReport, RepairPriority } from '../types';

const PRIORITIES: RepairPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const getLifecycleActions = (status: CitizenReport['status']) => {
    switch (canonicalizeStatus(status)) {
        case 'New':
            return [
                { label: 'Verify Report', status: 'Verified' as const, icon: ShieldCheck, className: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' },
                { label: 'Reject Report', status: 'Rejected' as const, icon: XCircle, className: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' },
            ];
        case 'Verified':
            return [
                { label: 'Mark as Scheduled', status: 'Scheduled' as const, icon: CalendarClock, className: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' },
                { label: 'Reject Report', status: 'Rejected' as const, icon: XCircle, className: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' },
            ];
        case 'Scheduled':
            return [
                { label: 'Mark as In Progress', status: 'In Progress' as const, icon: Play, className: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' },
            ];
        case 'In Progress':
            return [
                { label: 'Mark as Completed', status: 'Completed' as const, icon: CheckCircle2, className: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' },
            ];
        default:
            return [];
    }
};

const StaffReportDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [report, setReport] = useState<CitizenReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [lightbox, setLightbox] = useState(false);

    // Editable fields
    const [selectedPriority, setSelectedPriority] = useState<RepairPriority>('Medium');
    const [maintenanceNotes, setMaintenanceNotes] = useState('');

    const loadReport = async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            if (user?.role === 'MAINTENANCE_OFFICER' && !hasOfficerProvince(user.provincialCouncil)) {
                setError(OFFICER_PROVINCE_MISSING);
                return;
            }

            const staffProvince = normalizeProvince(user?.provincialCouncil);
            
            const data = await reportsApi.getById(id);
            if (!data) {
                setError('Report not found in the database.');
                return;
            }
            
            const reportProvince = normalizeProvince(data.provincialCouncil);

            // Access control: staff can only see their province's reports
            if (user?.role === 'MAINTENANCE_OFFICER' && staffProvince !== 'unassigned' &&
                reportProvince !== 'unassigned' && staffProvince !== reportProvince) {
                setError('Access Restricted: This report belongs to another Provincial Council.');
                return;
            }
            setReport(data);
            setSelectedPriority(data.priority || 'Medium');
            setMaintenanceNotes(data.maintenanceNotes || '');
        } catch (err: any) {
            setError(`Failed to load: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport();
    }, [id]);

    const handleUpdateMetadata = async () => {
        if (!report || !id) return;
        setSaving(true);
        setSaved(false);
        try {
            const updated = await reportsApi.update(id, {
                priority: selectedPriority,
                maintenanceNotes: maintenanceNotes,
            });
            if (updated) {
                setReport(updated);
                setSelectedPriority(updated.priority || selectedPriority);
                setMaintenanceNotes(updated.maintenanceNotes || maintenanceNotes);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error('Failed to update report:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleLifecycleAction = async (nextStatus: CitizenReport['status'], label: string) => {
        if (!report || !id) return;
        setSaving(true);
        setSaved(false);
        try {
            const note = maintenanceNotes || `${label} by ${user?.name || 'officer'}.`;
            const updated = await reportsApi.updateStatus(id, nextStatus, note, selectedPriority);
            if (updated) {
                setReport(updated);
                setSelectedPriority(updated.priority || selectedPriority);
                setMaintenanceNotes(updated.maintenanceNotes || note);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error('Failed to update report lifecycle:', err);
        } finally {
            setSaving(false);
        }
    };

    const backPath = user?.role === 'ADMIN' ? '/admin/reports' : '/staff/overview';

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center rounded-3xl border border-slate-100 bg-white p-10">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading report details</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm max-w-md mx-auto mt-10">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={32} className="text-slate-300" />
                </div>
                <h1 className="text-xl font-black text-slate-950 mb-2 uppercase tracking-tight">{error || 'Report not found'}</h1>
                <p className="text-sm text-slate-500 font-bold mb-6">The report may have been removed or you do not have access.</p>
                <button onClick={() => navigate(backPath)} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Return to Dashboard</button>
            </div>
        );
    }

    const submittedDate = format(new Date(report.createdAt), 'dd MMM yyyy');
    const submittedTime = format(new Date(report.createdAt), 'hh:mm:ss a');
    const description = report.description?.replace(/^\[.*?\]\s*/, '') || 'Road Damage Report';
    const lifecycleActions = getLifecycleActions(report.status);
    const reportStatus = canonicalizeStatus(report.status);
    const isMetadataEditable = ['Verified', 'Scheduled', 'In Progress'].includes(reportStatus);

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'Urgent': return 'bg-rose-500 text-white border-rose-500 shadow-rose-500/20';
            case 'High': return 'bg-orange-500 text-white border-orange-500 shadow-orange-500/20';
            case 'Medium': return 'bg-blue-500 text-white border-blue-500 shadow-blue-500/20';
            case 'Low': return 'bg-slate-400 text-white border-slate-400 shadow-slate-400/20';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-8 pb-20 animate-fade-in-up">
            {/* Lightbox overlay */}
            {lightbox && report.imageUrl && (
                <div 
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer animate-fade-in"
                    onClick={() => setLightbox(false)}
                >
                    <img src={report.imageUrl} alt="Evidence" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white text-sm font-black uppercase tracking-widest">Close ✕</button>
                </div>
            )}

            {/* Back button */}
            <button
                onClick={() => navigate(backPath)}
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900"
            >
                <ArrowLeft size={14} /> Back to Operations
            </button>

            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
                        <Activity size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-black text-slate-950 tracking-tight uppercase">Report #{id?.split('-')[1] || id?.slice(0, 8)}</h1>
                            <StatusPill status={report.status as any} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            {report.provincialCouncil ? getProvinceShortName(report.provincialCouncil) : 'Unknown'} · {report.district || 'Unknown District'}
                        </p>
                    </div>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-xs font-black uppercase tracking-widest animate-fade-in-up">
                        <CheckCircle2 size={16} /> Update Successful
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_380px]">
                {/* Left Column: Evidence & Details */}
                <main className="space-y-8">
                    {/* Image Evidence */}
                    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                                    <ImageIcon size={18} />
                                </div>
                                <div>
                                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Visual Evidence</h2>
                                    <p className="text-[10px] font-bold text-slate-400">Citizen-submitted field imagery</p>
                                </div>
                            </div>
                            {report.imageUrl && (
                                <button 
                                    onClick={() => setLightbox(true)}
                                    className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                                    title="View full size"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            )}
                        </div>
                        <div className="p-6">
                            <div 
                                className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 aspect-video group cursor-pointer"
                                onClick={() => report.imageUrl && setLightbox(true)}
                            >
                                {report.imageUrl ? (
                                    <img 
                                        src={report.imageUrl} 
                                        alt="Report evidence" 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xs font-black uppercase tracking-widest text-slate-400">
                                        No Image Uploaded
                                    </div>
                                )}
                                {report.imageUrl && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-8">
                                        <p className="text-white text-xs font-black uppercase tracking-widest translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                            Click to enlarge
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Detail Grid */}
                    <section className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
                            <DetailBlock icon={Calendar} label="Submitted Date" value={submittedDate} />
                            <DetailBlock icon={Clock} label="Submitted Time" value={submittedTime} />
                            <DetailBlock icon={MapPin} label="Coordinates" value={`${report.lat.toFixed(5)}, ${report.lon.toFixed(5)}`} />
                            <DetailBlock icon={User} label="Submitted By" value={report.citizenId || 'Anonymous'} />
                            <DetailBlock icon={ShieldCheck} label="Province" value={report.provincialCouncil ? getProvinceShortName(report.provincialCouncil) : 'Unknown'} />
                            <DetailBlock icon={MapPin} label="District" value={report.district || 'Unknown'} />
                        </div>
                    </section>

                    {/* Description */}
                    <section className="rounded-3xl border border-slate-100 bg-white shadow-sm p-8">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Citizen Description</h3>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                "{description}"
                            </p>
                        </div>
                    </section>

                    {/* AI Classification */}
                    {report.aiClassification && (
                        <section className="rounded-3xl border border-slate-100 bg-white shadow-sm p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                                    <Brain size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">AI Analysis</h3>
                                    <p className="text-[10px] font-bold text-slate-400">Automated pothole detection results</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Classification</p>
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                                        report.aiClassification === 'VERIFIED_POTHOLE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        report.aiClassification === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                        'bg-amber-50 text-amber-600 border border-amber-100'
                                    )}>
                                        {report.aiClassification === 'VERIFIED_POTHOLE' ? <CheckCircle2 size={12} /> : 
                                         report.aiClassification === 'REJECTED' ? <XCircle size={12} /> :
                                         <AlertCircle size={12} />}
                                        {report.aiClassification.replace(/_/g, ' ')}
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Confidence</p>
                                    <p className="text-xl font-black text-slate-900">
                                        {report.aiConfidence ? `${(report.aiConfidence * 100).toFixed(1)}%` : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Detection Model</p>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                        {report.detectionModel || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                <Info size={16} className="text-slate-400 shrink-0" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tight leading-relaxed">
                                    Officer Guidance: Please verify visual evidence against reported coordinates before scheduling repairs.
                                </p>
                            </div>
                        </section>
                    )}
                </main>

                {/* Right Column: Management Panel */}
                <aside className="space-y-6 h-fit lg:sticky lg:top-8">
                    <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                        <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-5">
                            <div className="rounded-xl bg-slate-900 p-3 text-white">
                                <Activity size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-950 uppercase tracking-tight">Report Management</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifecycle Actions</p>
                            </div>
                        </div>

                        <div className="space-y-7">
                            {lifecycleActions.length > 0 ? (
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block px-1">Required Actions</label>
                                    <div className="space-y-2">
                                        {lifecycleActions.map(action => {
                                            const Icon = action.icon;
                                            return (
                                                <button
                                                    key={action.status}
                                                    onClick={() => handleLifecycleAction(action.status, action.label)}
                                                    disabled={saving}
                                                    className={cn(
                                                        'flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-60',
                                                        action.className
                                                    )}
                                                >
                                                    <Icon size={15} /> {action.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                                    <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workflow Finalized</p>
                                </div>
                            )}

                            {/* Priority Selector (Only for active reports) */}
                            <div className={cn("space-y-3", !isMetadataEditable && "opacity-50 pointer-events-none")}>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block px-1">Update Priority</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PRIORITIES.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setSelectedPriority(p)}
                                            className={cn(
                                                "py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm",
                                                selectedPriority === p
                                                    ? getPriorityColor(p)
                                                    : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Maintenance Notes */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block px-1">Action Notes</label>
                                <textarea
                                    value={maintenanceNotes}
                                    onChange={(e) => setMaintenanceNotes(e.target.value)}
                                    rows={5}
                                    placeholder="Add observations or notes..."
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 resize-none"
                                />
                            </div>
                        </div>

                        {isMetadataEditable && (
                            <button
                                onClick={handleUpdateMetadata}
                                disabled={saving}
                                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-black active:scale-[0.98] disabled:opacity-60"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Saving...' : 'Update Notes & Priority'}
                            </button>
                        )}
                    </section>

                    {/* Report Metadata Card */}
                    <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/30 border border-white/5 relative overflow-hidden">
                        <div className="absolute -bottom-8 -right-8 opacity-[0.03]">
                            <ShieldCheck size={160} />
                        </div>
                        <div className="relative z-10 flex items-center gap-3 mb-5">
                            <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                                <ShieldCheck className="text-emerald-400" size={16} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">System Metadata</h4>
                        </div>
                        <div className="relative z-10 space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Report ID</span>
                                <span className="text-[10px] font-black text-white font-mono">{report.id}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Citizen ID</span>
                                <span className="text-[10px] font-black text-white font-mono truncate max-w-[160px]">{report.citizenId}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Created</span>
                                <span className="text-[10px] font-black text-white">{submittedDate} · {submittedTime}</span>
                            </div>
                            {report.lastStatusUpdatedAt && (
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Last Updated</span>
                                    <span className="text-[10px] font-black text-white">{format(new Date(report.lastStatusUpdatedAt), 'dd MMM yyyy, hh:mm a')}</span>
                                </div>
                            )}
                        </div>
                        <div className="relative z-10 pt-5 mt-5 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">RoadPulse</span>
                            <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                LIVE
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};

const DetailBlock = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) => (
    <div className="bg-white p-6">
        <div className="flex items-start gap-4">
            <div className="rounded-xl bg-slate-50 p-3 text-slate-400">
                <Icon size={16} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className={cn("mt-1 truncate text-sm font-black text-slate-900", color)}>{value}</p>
            </div>
        </div>
    </div>
);

export default StaffReportDetail;
