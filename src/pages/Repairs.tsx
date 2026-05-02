import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    ClipboardEdit,
    Filter,
    MapPin,
    Play,
    Save,
    StickyNote,
    Wrench,
    AlertTriangle
} from 'lucide-react';
import { potholesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { PotholeEvent, RepairPriority, RepairScheduleInput, RepairStatus } from '../types';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { getProvinceShortName } from '../lib/provinceResolver';

const PRIORITIES: RepairPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const REPAIR_STATUSES: RepairStatus[] = ['Verified', 'In Progress', 'Completed'];

const emptyForm: RepairScheduleInput = {
    priority: 'Medium',
    assignedTeam: 'Unassigned',
    scheduledDate: new Date().toISOString(),
    maintenanceNotes: '',
    repairStatus: 'Verified',
};

const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10';

const getSection = (pothole: PotholeEvent) => {
    if (['Completed', 'Fixed'].includes(pothole.status)) return 'Completed Repairs';
    if (pothole.status === 'In Progress') return 'Work In Progress';
    return 'Verified for Repair';
};

const RepairsPage = () => {
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<RepairPriority | 'All'>('All');
    const [selected, setSelected] = useState<PotholeEvent | null>(null);
    const [form, setForm] = useState<RepairScheduleInput>(emptyForm);
    const [saving, setSaving] = useState(false);

    const loadPotholes = async () => {
        setLoading(true);
        setError('');
        try {
            let data = await potholesApi.list();
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

    const openUpdate = (pothole: PotholeEvent) => {
        setSelected(pothole);
        setForm({
            priority: pothole.priority || 'Medium',
            assignedTeam: 'Unassigned',
            scheduledDate: pothole.timestamp || new Date().toISOString(),
            maintenanceNotes: pothole.maintenanceNotes || '',
            repairStatus: (['Fixed', 'Completed'].includes(pothole.status) ? 'Completed' : pothole.status) as RepairStatus,
        });
    };

    const saveUpdate = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await potholesApi.scheduleRepair(selected.id, form, user?.name || 'Maintenance Officer');
            await loadPotholes();
            setSelected(null);
        } finally {
            setSaving(false);
        }
    };

    const quickStatusUpdate = async (pothole: PotholeEvent, status: 'In Progress' | 'Completed') => {
        await potholesApi.updateStatus(pothole.id, status, `Status manually updated by ${user?.name || 'officer'}.`, user?.name);
        await loadPotholes();
    };

    const filteredPotholes = useMemo(() => {
        const operational = potholes.filter(p => !['New', 'Rejected', 'Confirmed'].includes(p.status) || p.status === 'Verified');
        if (priorityFilter === 'All') return operational;
        return operational.filter(p => p.priority === priorityFilter);
    }, [potholes, priorityFilter]);

    const sections = useMemo(() => {
        const grouped: Record<string, PotholeEvent[]> = {
            'Verified for Repair': [],
            'Work In Progress': [],
            'Completed Repairs': [],
        };

        filteredPotholes.forEach(pothole => {
            const section = getSection(pothole);
            if (grouped[section]) grouped[section].push(pothole);
        });

        return grouped;
    }, [filteredPotholes]);

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
                    <p className="text-sm font-bold text-slate-500">Track provincial road repairs, update progress, and manage maintenance priorities.</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    <Filter size={16} className="ml-2 text-slate-400" />
                    <select
                        value={priorityFilter}
                        onChange={event => setPriorityFilter(event.target.value as RepairPriority | 'All')}
                        className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 outline-none"
                    >
                        <option value="All">All Priorities</option>
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm font-bold text-rose-700">
                    {error}
                </div>
            )}

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
                                    <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">{title}</h2>
                                    <p className="text-xs font-bold text-slate-400">{items.length} active records</p>
                                </div>
                            </div>
                            {items.length === 0 ? (
                                <p className="rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-500 italic">No records in this sector.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    {items.map(item => (
                                        <RepairCard
                                            key={item.id}
                                            pothole={item}
                                            onUpdate={() => openUpdate(item)}
                                            onStart={() => quickStatusUpdate(item, 'In Progress')}
                                            onComplete={() => quickStatusUpdate(item, 'Completed')}
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
                    <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-8 shadow-2xl">
                        <div className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">Update Repair Progress</h2>
                                <p className="mt-1 text-sm font-bold text-slate-500">#{selected.id.split('-')[0]} · {selected.district} Sector</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <AlertTriangle size={24} className="rotate-180" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Field label="Categorize Priority">
                                <select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value as RepairPriority })} className={fieldClass}>
                                    {PRIORITIES.map(priority => <option key={priority} value={priority}>{priority}</option>)}
                                </select>
                            </Field>
                            <Field label="Current Status">
                                <select value={form.repairStatus} onChange={event => setForm({ ...form, repairStatus: event.target.value as RepairStatus })} className={fieldClass}>
                                    {REPAIR_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </Field>
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Maintenance & Field Notes</label>
                                <textarea
                                    value={form.maintenanceNotes}
                                    onChange={event => setForm({ ...form, maintenanceNotes: event.target.value })}
                                    rows={4}
                                    placeholder="Add field coordination notes, material updates, or completion remarks..."
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setSelected(null)} className="flex-1 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
                            <button
                                onClick={saveUpdate}
                                disabled={saving}
                                className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-black disabled:opacity-60"
                            >
                                <Save size={16} /> {saving ? 'Syncing...' : 'Update Records'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RepairCard = ({
    pothole,
    onUpdate,
    onStart,
    onComplete,
}: {
    pothole: PotholeEvent;
    onUpdate: () => void;
    onStart: () => void;
    onComplete: () => void;
}) => {
    const isDone = ['Completed', 'Fixed'].includes(pothole.status);
    const isInProgress = pothole.status === 'In Progress';

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm group hover:shadow-md transition-all">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black text-slate-950 uppercase tracking-tight">#{pothole.id.split('-')[0]}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                        <MapPin size={12} className="text-slate-400" /> {pothole.roadName || pothole.district}
                    </p>
                </div>
                <StatusPill status={pothole.status as any} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={cn(
                    "rounded-xl border p-3",
                    ['High', 'Urgent'].includes(pothole.priority || '') ? "border-rose-100 bg-rose-50 text-rose-700" : "border-slate-100 bg-slate-50"
                )}>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Priority</p>
                    <p className="mt-0.5 font-black text-xs">{pothole.priority || 'Medium'}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 text-slate-400">Report Date</p>
                    <p className="mt-0.5 font-black text-xs text-slate-700">{new Date(pothole.timestamp).toLocaleDateString()}</p>
                </div>
            </div>

            {pothole.maintenanceNotes && (
                <div className="mb-4 rounded-xl bg-slate-50 p-3 border border-slate-100/50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Maintenance Note</p>
                    <p className="text-[11px] font-bold leading-relaxed text-slate-600 italic">
                        "{pothole.maintenanceNotes}"
                    </p>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={onUpdate}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/10 hover:bg-black transition-all"
                >
                    <ClipboardEdit size={13} /> Update Status
                </button>
                
                {!isDone && !isInProgress && (
                    <button
                        onClick={onStart}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        <Play size={13} /> Start Work
                    </button>
                )}

                {isInProgress && (
                    <button
                        onClick={onComplete}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-all"
                    >
                        <CheckCircle2 size={13} /> Mark Completed
                    </button>
                )}

                <Link 
                    to={`/potholes/${pothole.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all ml-auto"
                >
                    View Record
                </Link>
            </div>
        </div>
    );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label>
        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        {children}
    </label>
);

export default RepairsPage;
