import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Save,
    ShieldCheck,
    Activity
} from 'lucide-react';
import { potholesApi, reportsApi } from '../lib/api';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { getProvinceShortName } from '../lib/provinceResolver';
import type { CitizenReport, PotholeEvent, RepairPriority, RepairScheduleInput, RepairStatus } from '../types';

const PRIORITIES: RepairPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const REPAIR_STATUSES: RepairStatus[] = ['Verified', 'In Progress', 'Completed'];
const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10';

const PotholeDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pothole, setPothole] = useState<PotholeEvent | null>(null);
    const [report, setReport] = useState<CitizenReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<RepairScheduleInput>({
        priority: 'Medium',
        assignedTeam: 'Unassigned',
        scheduledDate: new Date().toISOString(),
        maintenanceNotes: '',
        repairStatus: 'Verified',
    });

    const loadDetail = async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const item = await potholesApi.getById(id);
            if (!item) {
                setPothole(null);
                return;
            }

            // Access Control: Officer must match province
            if (user?.role === 'MAINTENANCE_OFFICER' && user.provincialCouncil !== item.provincialCouncil) {
                setError('Access Restricted: This record belongs to another Provincial Council.');
                setPothole(null);
                return;
            }

            setPothole(item);
            setForm({
                priority: item.priority || 'Medium',
                assignedTeam: 'Unassigned',
                scheduledDate: item.timestamp || new Date().toISOString(),
                maintenanceNotes: item.maintenanceNotes || '',
                repairStatus: (['Fixed', 'Completed'].includes(item.status) ? 'Completed' : item.status) as RepairStatus,
            });

            if (item.reportId) {
                try {
                    const matched = await reportsApi.list({ status: undefined }); // Fetch all to find specific one
                    const found = matched.find(r => r.id === item.reportId) || null;
                    setReport(found);
                } catch (e) {
                    console.error("Failed to load report evidence:", e);
                }
            }
        } catch {
            setError('Failed to load detail. Record may not exist.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
    }, [id]);

    const saveStatusUpdate = async () => {
        if (!pothole) return;
        setSaving(true);
        try {
            await potholesApi.scheduleRepair(pothole.id, form, user?.name || 'Maintenance Officer');
            await loadDetail();
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading record details</p>
                </div>
            </div>
        );
    }

    if (error || !pothole) {
        return (
            <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm max-w-md mx-auto">
                <h1 className="text-xl font-black text-slate-950 mb-2 uppercase tracking-tight">{error || 'Pothole not found'}</h1>
                <p className="text-slate-500 font-bold mb-6 text-sm">Identity authorization or record existence issue detected.</p>
                <button onClick={() => navigate(-1)} className="btn-premium bg-slate-900 text-white w-full py-3">Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 pb-20">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900"
            >
                <ArrowLeft size={14} /> Back to Operations
            </button>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
                <main className="space-y-8">
                    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-black tracking-tight text-slate-950">{pothole.id}</h1>
                                    {pothole.provincialCouncil && (
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                                            <MapPin size={12} /> {getProvinceShortName(pothole.provincialCouncil)}
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-slate-500">{pothole.roadName || 'Road location pending'} · {pothole.district || 'Area not set'}</p>
                            </div>
                            <StatusPill status={pothole.status as any} />
                        </div>

                        <div className="grid grid-cols-1 gap-px bg-slate-100 md:grid-cols-3">
                            <InfoBlock icon={Calendar} label="Discovery Date" value={new Date(pothole.createdAt || pothole.timestamp).toLocaleDateString()} />
                            <InfoBlock icon={MapPin} label="Coordinates" value={`${pothole.lat.toFixed(5)}, ${pothole.lon.toFixed(5)}`} />
                            <InfoBlock icon={ShieldCheck} label="Priority" value={pothole.priority || 'Medium'} />
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">Report Evidence</h2>
                                <p className="text-xs font-bold text-slate-400">Official imagery and citizen testimony.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
                                {pothole.imageUrl ? (
                                    <img src={pothole.imageUrl} alt="Road damage evidence" className="aspect-video w-full object-cover" />
                                ) : (
                                    <div className="flex aspect-video items-center justify-center text-xs font-black uppercase tracking-widest text-slate-400">No Image Uploaded</div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Citizen Testimony</p>
                                    <p className="text-xs font-bold leading-relaxed text-slate-700 italic">"{report?.description || pothole.maintenanceNotes || 'No description provided.'}"</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Report Origin</p>
                                    <p className="text-xs font-bold text-slate-900 tracking-tight">{report?.submittedBy || 'Anonymous Contributor'}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <ActivityTimeline entityId={pothole.id} />
                </main>

                <aside className="space-y-6">
                    <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                        <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-5">
                            <div className="rounded-xl bg-slate-900 p-3 text-white">
                                <Activity size={18} />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">Record Management</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update status & priorities.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Field label="Categorize Priority">
                                <select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value as RepairPriority })} className={fieldClass}>
                                    {PRIORITIES.map(priority => <option key={priority} value={priority}>{priority}</option>)}
                                </select>
                            </Field>
                            <Field label="Field Operation Status">
                                <select value={form.repairStatus} onChange={event => setForm({ ...form, repairStatus: event.target.value as RepairStatus })} className={fieldClass}>
                                    {REPAIR_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </Field>
                            <Field label="Maintenance & Field Notes">
                                <textarea
                                    value={form.maintenanceNotes}
                                    onChange={event => setForm({ ...form, maintenanceNotes: event.target.value })}
                                    rows={6}
                                    placeholder="Add field coordination notes, material updates, or completion remarks..."
                                    className={`${fieldClass} resize-none`}
                                />
                            </Field>
                        </div>

                        <button
                            onClick={saveStatusUpdate}
                            disabled={saving}
                            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-black disabled:opacity-60"
                        >
                            <Save size={16} /> {saving ? 'Syncing...' : 'Update Maintenance Record'}
                        </button>
                    </section>
                </aside>
            </div>
        </div>
    );
};

const InfoBlock = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
    <div className="bg-white p-6">
        <div className="flex items-start gap-4">
            <div className="rounded-xl bg-slate-50 p-3 text-slate-400">
                <Icon size={16} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
            </div>
        </div>
    </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block">
        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        {children}
    </label>
);

export default PotholeDetail;
