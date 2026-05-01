import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    ClipboardList,
    MapPin,
    Save,
    ShieldCheck,
    Users,
    Wrench
} from 'lucide-react';
import { getPotholeById, listCitizenReports, potholesApi } from '../lib/api';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import type { CitizenReport, PotholeEvent, RepairPriority, RepairScheduleInput, RepairStatus, RepairTeam } from '../types';

const TEAMS: RepairTeam[] = ['Team A', 'Team B', 'Team C', 'Emergency Team'];
const PRIORITIES: RepairPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const REPAIR_STATUSES: RepairStatus[] = ['Verified', 'Scheduled', 'In Progress', 'Completed', 'Unable to Repair'];
const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10';

const PotholeDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pothole, setPothole] = useState<PotholeEvent | null>(null);
    const [report, setReport] = useState<CitizenReport | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<RepairScheduleInput>({
        priority: 'Medium',
        assignedTeam: 'Team A',
        scheduledDate: new Date().toISOString().slice(0, 10),
        maintenanceNotes: '',
        repairStatus: 'Scheduled',
    });

    const loadDetail = () => {
        const item = id ? getPotholeById(id) : null;
        if (!item) return;

        setPothole(item);
        setForm({
            priority: item.priority || 'Medium',
            assignedTeam: item.assignedTeam || 'Team A',
            scheduledDate: item.scheduledDate ? item.scheduledDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
            maintenanceNotes: item.maintenanceNotes || '',
            repairStatus: item.repairStatus || (item.status === 'Verified' || item.status === 'Confirmed' ? 'Verified' : 'Scheduled'),
        });

        if (item.reportId) {
            const matched = listCitizenReports().find(entry => entry.id === item.reportId) || null;
            setReport(matched);
        }
    };

    useEffect(() => {
        loadDetail();
    }, [id]);

    const saveSchedule = async () => {
        if (!pothole) return;
        setSaving(true);
        try {
            await potholesApi.scheduleRepair(pothole.id, {
                ...form,
                scheduledDate: new Date(form.scheduledDate).toISOString(),
            }, user?.name || 'Maintenance Officer');
            loadDetail();
        } finally {
            setSaving(false);
        }
    };

    if (!pothole) {
        return (
            <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                <h1 className="text-xl font-black text-slate-950">Pothole not found</h1>
                <button onClick={() => navigate(-1)} className="mt-4 text-sm font-bold text-emerald-700">Go back</button>
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
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Repair Location</p>
                                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{pothole.id}</h1>
                                <p className="mt-1 text-sm font-bold text-slate-500">{pothole.roadName || 'Road location pending'} · {pothole.district || 'Area not set'}</p>
                            </div>
                            <StatusPill status={pothole.status as any} />
                        </div>

                        <div className="grid grid-cols-1 gap-px bg-slate-100 md:grid-cols-2">
                            <InfoBlock icon={Calendar} label="Reported On" value={new Date(pothole.createdAt || pothole.timestamp).toLocaleString()} />
                            <InfoBlock icon={MapPin} label="Location" value={`${pothole.lat.toFixed(6)}, ${pothole.lon.toFixed(6)}`} />
                            <InfoBlock icon={Users} label="Assigned Team" value={pothole.assignedTeam || 'Unassigned'} />
                            <InfoBlock icon={ShieldCheck} label="Priority" value={pothole.priority || 'Medium'} />
                            <InfoBlock icon={Wrench} label="Scheduled Date" value={pothole.scheduledDate ? new Date(pothole.scheduledDate).toLocaleDateString() : 'Not scheduled'} />
                            <InfoBlock icon={ClipboardList} label="Report Reference" value={pothole.reportId || 'No linked report'} />
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-slate-950">Report Evidence</h2>
                                <p className="text-xs font-bold text-slate-400">Photo, location, and citizen description for field review.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="overflow-hidden rounded-2xl bg-slate-100">
                                {pothole.imageUrl ? (
                                    <img src={pothole.imageUrl} alt="Road damage evidence" className="h-full min-h-[320px] w-full object-cover" />
                                ) : (
                                    <div className="flex min-h-[320px] items-center justify-center text-sm font-bold text-slate-400">No image uploaded</div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Citizen Description</p>
                                    <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700">{report?.description || pothole.maintenanceNotes || 'No description provided.'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reporter</p>
                                    <p className="mt-2 text-sm font-bold text-slate-700">{report?.submittedBy || report?.citizenId || 'Registered citizen'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Maintenance Notes</p>
                                    <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700">{pothole.maintenanceNotes || 'No maintenance notes yet.'}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <ActivityTimeline entityId={pothole.id} />
                </main>

                <aside className="space-y-6">
                    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                                <Wrench size={18} />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-950">Scheduling Workflow</h2>
                                <p className="text-xs font-bold text-slate-400">Assign team, priority, date, and status.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Field label="Priority">
                                <select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value as RepairPriority })} className={fieldClass}>
                                    {PRIORITIES.map(priority => <option key={priority} value={priority}>{priority}</option>)}
                                </select>
                            </Field>
                            <Field label="Repair Team">
                                <select value={form.assignedTeam} onChange={event => setForm({ ...form, assignedTeam: event.target.value as RepairTeam })} className={fieldClass}>
                                    {TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                                </select>
                            </Field>
                            <Field label="Scheduled Repair Date">
                                <input type="date" value={form.scheduledDate} onChange={event => setForm({ ...form, scheduledDate: event.target.value })} className={fieldClass} />
                            </Field>
                            <Field label="Current Repair Status">
                                <select value={form.repairStatus} onChange={event => setForm({ ...form, repairStatus: event.target.value as RepairStatus })} className={fieldClass}>
                                    {REPAIR_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </Field>
                            <Field label="Maintenance Notes">
                                <textarea
                                    value={form.maintenanceNotes}
                                    onChange={event => setForm({ ...form, maintenanceNotes: event.target.value })}
                                    rows={5}
                                    placeholder="Crew instructions, access concerns, materials, or follow-up notes..."
                                    className={`${fieldClass} resize-none`}
                                />
                            </Field>
                        </div>

                        <button
                            onClick={saveSchedule}
                            disabled={saving}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-black disabled:opacity-60"
                        >
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Schedule'}
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
