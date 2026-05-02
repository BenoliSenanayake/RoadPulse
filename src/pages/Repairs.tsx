import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Calendar,
    CheckCircle2,
    ClipboardEdit,
    Filter,
    MapPin,
    Play,
    Save,
    StickyNote,
    Users,
    Wrench
} from 'lucide-react';
import { potholesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { PotholeEvent, RepairPriority, RepairScheduleInput, RepairStatus, RepairTeam } from '../types';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { getProvinceShortName } from '../lib/provinceResolver';

const TEAMS: RepairTeam[] = ['Team A', 'Team B', 'Team C', 'Emergency Team'];
const PRIORITIES: RepairPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const REPAIR_STATUSES: RepairStatus[] = ['Verified', 'Scheduled', 'In Progress', 'Completed', 'Unable to Repair'];

const emptyForm: RepairScheduleInput = {
    priority: 'Medium',
    assignedTeam: 'Team A',
    scheduledDate: new Date().toISOString().slice(0, 10),
    maintenanceNotes: '',
    repairStatus: 'Scheduled',
};

const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10';

const getSection = (pothole: PotholeEvent) => {
    if (['Completed', 'Fixed', 'Unable to Repair'].includes(pothole.status)) return 'Completed';
    if (pothole.status === 'In Progress') return 'In Progress';
    if (pothole.status === 'Scheduled') return 'Scheduled Repairs';
    return 'Unscheduled Verified Potholes';
};

const getWorkload = (count: number) => {
    if (count <= 1) return { label: 'Available', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (count <= 4) return { label: 'Moderate', className: 'bg-amber-50 text-amber-700 border-amber-100' };
    return { label: 'Busy', className: 'bg-rose-50 text-rose-700 border-rose-100' };
};

const RepairsPage = () => {
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [teamFilter, setTeamFilter] = useState<RepairTeam | 'All'>('All');
    const [selected, setSelected] = useState<PotholeEvent | null>(null);
    const [form, setForm] = useState<RepairScheduleInput>(emptyForm);
    const [saving, setSaving] = useState(false);

    const loadPotholes = async () => {
        setLoading(true);
        setError('');
        try {
            let data = await potholesApi.list();
            // Filter by province for maintenance officers
            if (province && province !== 'Unassigned') {
                data = data.filter(p => p.provincialCouncil === province);
            }
            setPotholes(data);
        } catch {
            setError('Failed to load repairs data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPotholes();
    }, [province]);

    const openSchedule = (pothole: PotholeEvent, status: RepairStatus = 'Scheduled') => {
        setSelected(pothole);
        setForm({
            priority: pothole.priority || 'Medium',
            assignedTeam: pothole.assignedTeam || 'Team A',
            scheduledDate: pothole.scheduledDate ? pothole.scheduledDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
            maintenanceNotes: pothole.maintenanceNotes || '',
            repairStatus: status,
        });
    };

    const saveSchedule = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                scheduledDate: new Date(form.scheduledDate).toISOString(),
            };
            await potholesApi.scheduleRepair(selected.id, payload, user?.name || 'Maintenance Officer');
            await loadPotholes();
            setSelected(null);
        } finally {
            setSaving(false);
        }
    };

    const quickUpdate = async (pothole: PotholeEvent, status: 'In Progress' | 'Completed') => {
        await potholesApi.updateStatus(pothole.id, status, status === 'In Progress' ? 'Work started by repair team.' : 'Repair work completed.', user?.name);
        await loadPotholes();
    };

    const filteredPotholes = useMemo(() => {
        const operational = potholes.filter(p => !['New', 'Rejected'].includes(p.status));
        if (teamFilter === 'All') return operational;
        return operational.filter(p => p.assignedTeam === teamFilter);
    }, [potholes, teamFilter]);

    const sections = useMemo(() => {
        const grouped: Record<string, PotholeEvent[]> = {
            'Unscheduled Verified Potholes': [],
            'Scheduled Repairs': [],
            'In Progress': [],
            'Completed': [],
        };

        filteredPotholes.forEach(pothole => {
            grouped[getSection(pothole)].push(pothole);
        });

        return grouped;
    }, [filteredPotholes]);

    const teamStats = useMemo(() => {
        return TEAMS.map(team => {
            const assigned = potholes.filter(p => p.assignedTeam === team);
            const pending = assigned.filter(p => !['Completed', 'Fixed', 'Unable to Repair', 'Rejected'].includes(p.status));
            const today = assigned.filter(p => p.scheduledDate?.slice(0, 10) === new Date().toISOString().slice(0, 10));
            const completed = assigned.filter(p => ['Completed', 'Fixed'].includes(p.status));
            return { team, assigned: assigned.length, pending: pending.length, today: today.length, completed: completed.length, workload: getWorkload(pending.length) };
        });
    }, [potholes]);

    return (
        <div className="space-y-8 pb-12 animate-fade-in-up">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="section-heading">Repair Operations</h1>
                        {province && province !== 'Unassigned' && (
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                                <MapPin size={12} /> {getProvinceShortName(province)}
                            </div>
                        )}
                    </div>
                    <p className="text-sm font-bold text-slate-500">Schedule verified potholes, assign teams, and track field progress.</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    <Filter size={16} className="ml-2 text-slate-400" />
                    <select
                        value={teamFilter}
                        onChange={event => setTeamFilter(event.target.value as RepairTeam | 'All')}
                        className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 outline-none"
                    >
                        <option value="All">All Teams</option>
                        {TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                    </select>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm font-bold text-rose-700">
                    {error}
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {teamStats.map(stat => (
                    <button
                        key={stat.team}
                        type="button"
                        onClick={() => setTeamFilter(stat.team)}
                        className={cn(
                            'rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:border-emerald-200 hover:shadow-md',
                            teamFilter === stat.team ? 'border-emerald-400 ring-4 ring-emerald-500/10' : 'border-slate-100'
                        )}
                    >
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Users size={17} className="text-emerald-600" />
                                <h2 className="text-sm font-black text-slate-950">{stat.team}</h2>
                            </div>
                            <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest', stat.workload.className)}>
                                {stat.workload.label}
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <Metric label="Assigned" value={stat.assigned} />
                            <Metric label="Today" value={stat.today} />
                            <Metric label="Pending" value={stat.pending} />
                            <Metric label="Done" value={stat.completed} />
                        </div>
                    </button>
                ))}
            </section>

            {loading ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                    <Wrench className="mx-auto mb-3 animate-pulse text-slate-300" size={32} />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading repair board</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(sections).map(([title, items]) => (
                        <section key={title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-black text-slate-950">{title}</h2>
                                    <p className="text-xs font-bold text-slate-400">{items.length} repair items</p>
                                </div>
                            </div>
                            {items.length === 0 ? (
                                <p className="rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-500">No items in this section.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    {items.map(item => (
                                        <RepairCard
                                            key={item.id}
                                            pothole={item}
                                            onSchedule={() => openSchedule(item, 'Scheduled')}
                                            onStart={() => quickUpdate(item, 'In Progress')}
                                            onComplete={() => quickUpdate(item, 'Completed')}
                                            onNote={() => openSchedule(item, item.repairStatus || 'Scheduled')}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">Schedule Repair</h2>
                                <p className="mt-1 text-sm font-bold text-slate-500">{selected.id} · {selected.roadName || selected.district}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">Close</button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            <Field label="Scheduled Date">
                                <input type="date" value={form.scheduledDate} onChange={event => setForm({ ...form, scheduledDate: event.target.value })} className={fieldClass} />
                            </Field>
                            <Field label="Repair Status">
                                <select value={form.repairStatus} onChange={event => setForm({ ...form, repairStatus: event.target.value as RepairStatus })} className={fieldClass}>
                                    {REPAIR_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </Field>
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Maintenance Notes</label>
                                <textarea
                                    value={form.maintenanceNotes}
                                    onChange={event => setForm({ ...form, maintenanceNotes: event.target.value })}
                                    rows={4}
                                    placeholder="Add crew instructions, material needs, or access notes..."
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                />
                            </div>
                        </div>

                        <button
                            onClick={saveSchedule}
                            disabled={saving}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-black disabled:opacity-60"
                        >
                            <Save size={17} /> {saving ? 'Saving...' : 'Save Schedule'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const RepairCard = ({
    pothole,
    onSchedule,
    onStart,
    onComplete,
    onNote,
}: {
    pothole: PotholeEvent;
    onSchedule: () => void;
    onStart: () => void;
    onComplete: () => void;
    onNote: () => void;
}) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
            <div>
                <p className="text-sm font-black text-slate-950">{pothole.reportId || pothole.id}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <MapPin size={12} /> {pothole.roadName || pothole.district || 'Location pending'}
                </p>
            </div>
            <StatusPill status={pothole.status as any} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
            <Info label="Priority" value={pothole.priority || 'Medium'} highlight={['High', 'Urgent'].includes(pothole.priority || '')} />
            <Info label="Team" value={pothole.assignedTeam || 'Unassigned'} />
            <Info label="Scheduled" value={pothole.scheduledDate ? new Date(pothole.scheduledDate).toLocaleDateString() : 'Not scheduled'} />
            <Info label="Status" value={pothole.repairStatus || pothole.status} />
        </div>

        {pothole.maintenanceNotes && (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-bold leading-relaxed text-slate-500">
                {pothole.maintenanceNotes}
            </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
            <ActionButton onClick={onSchedule} icon={Calendar} label="Schedule" primary />
            <ActionButton onClick={onStart} icon={Play} label="Start Work" disabled={pothole.status === 'In Progress' || ['Completed', 'Fixed'].includes(pothole.status)} />
            <ActionButton onClick={onComplete} icon={CheckCircle2} label="Mark Completed" disabled={['Completed', 'Fixed'].includes(pothole.status)} />
            <ActionButton onClick={onNote} icon={StickyNote} label="Add Note" />
            <Link to={`/potholes/${pothole.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100">
                <ClipboardEdit size={13} /> View
            </Link>
        </div>
    </div>
);

const ActionButton = ({ icon: Icon, label, onClick, primary = false, disabled = false }: { icon: React.ElementType; label: string; onClick: () => void; primary?: boolean; disabled?: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40',
            primary ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
        )}
    >
        <Icon size={13} /> {label}
    </button>
);

const Info = ({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) => (
    <div className={cn('rounded-xl border p-3', highlight ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-slate-100 bg-slate-50')}>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</p>
        <p className="mt-1 truncate font-black">{value}</p>
    </div>
);

const Metric = ({ label, value }: { label: string; value: number }) => (
    <div>
        <p className="text-xl font-black text-slate-950">{value}</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label>
        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        {children}
    </label>
);

export default RepairsPage;
