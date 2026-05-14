import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    ClipboardEdit,
    Filter,
    MapPin,
    Play,
    Save,
    Wrench,
    AlertTriangle
} from 'lucide-react';
import { potholesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { PotholeEvent, RepairPriority, RepairScheduleInput, RepairStatus } from '../types';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { getProvinceShortName, normalizeProvince } from '../lib/provinceResolver';

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
    if (pothole.status === 'Completed') return 'Completed Repairs';
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
            if (!province || province === 'Unassigned') {
                setError('Officer province is missing. Please sign in again.');
                setLoading(false);
                return;
            }
            const staffProvince = normalizeProvince(province);
            console.log(`[Repairs Debug] Current User:`, user?.email, staffProvince);
            
            // Fetch with province filter
            const response = await potholesApi.list({ 
                provincialCouncil: province,
                limit: 1000 
            });
            const data = response.data || [];
            console.log(`[Repairs] Raw telemetry: ${data.length} records.`);
            
            const filtered = data.filter(p => normalizeProvince(p.provincialCouncil) === staffProvince);
            console.log(`[Repairs] Filtered for ${staffProvince}: ${filtered.length} records.`);
            
            setPotholes(filtered);
        } catch (err) {
            console.error("[Repairs] Sync failed", err);
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
            repairStatus: (pothole.status === 'Completed' ? 'Completed' : pothole.status) as RepairStatus,
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
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Repair Operations</h1>
                        {province && province !== 'Unassigned' && (
                            <div className="rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-text)] flex items-center gap-2">
                                <MapPin size={12} /> {getProvinceShortName(province)}
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Track provincial road repairs, update progress, and manage maintenance priorities.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-1.5 shadow-sm">
                        <div className="p-1.5 text-slate-400">
                            <Filter size={14} />
                        </div>
                        <select
                            value={priorityFilter}
                            onChange={event => setPriorityFilter(event.target.value as RepairPriority | 'All')}
                            className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:bg-white transition-colors"
                        >
                            <option value="All">All Priorities</option>
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm font-bold text-rose-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="rounded-xl border border-slate-100 bg-white p-16 text-center shadow-sm">
                    <div className="mx-auto mb-6 h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                        <Wrench className="animate-spin" size={24} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Synchronizing repair board</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(sections).map(([title, items]) => (
                        <section key={title}>
                            <div className="mb-6 flex items-center justify-between px-2">
                                <div>
                                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</h2>
                                    <p className="text-xl font-semibold tracking-tight text-slate-900">{items.length} Units Active</p>
                                </div>
                            </div>
                            {items.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-12 text-center">
                                    <p className="text-sm font-medium text-slate-400">No active operational units in this lifecycle stage.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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

            {/* Selection Dialog */}
            {selected && (
                <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-md sm:items-center animate-in fade-in duration-300">
                    <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 border border-slate-100">
                        <div className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Update Operational Status</h2>
                                <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">UNIT: #{selected.id.slice(0, 12)} · {selected.district} Sector</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-lg">
                                <AlertTriangle size={20} className="rotate-180" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Field label="Assign Priority">
                                <select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value as RepairPriority })} className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] font-semibold text-slate-700 outline-none focus:bg-white focus:border-[var(--accent-border)] focus:ring-4 focus:ring-[var(--accent-bg)] transition-all">
                                    {PRIORITIES.map(priority => <option key={priority} value={priority}>{priority}</option>)}
                                </select>
                            </Field>
                            <Field label="Current Status">
                                <select value={form.repairStatus} onChange={event => setForm({ ...form, repairStatus: event.target.value as RepairStatus })} className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] font-semibold text-slate-700 outline-none focus:bg-white focus:border-[var(--accent-border)] focus:ring-4 focus:ring-[var(--accent-bg)] transition-all">
                                    {REPAIR_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </Field>
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Maintenance Observations</label>
                                <textarea
                                    value={form.maintenanceNotes}
                                    onChange={event => setForm({ ...form, maintenanceNotes: event.target.value })}
                                    rows={4}
                                    placeholder="Add field coordination notes or material updates..."
                                    className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] font-medium text-slate-600 outline-none focus:bg-white focus:border-[var(--accent-border)] focus:ring-4 focus:ring-[var(--accent-bg)] transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setSelected(null)} className="flex-1 px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                            <button
                                onClick={saveUpdate}
                                disabled={saving}
                                className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg hover:bg-black disabled:opacity-60 transition-all"
                            >
                                <Save size={16} /> {saving ? 'Updating...' : 'Commit Update'}
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
    const isDone = pothole.status === 'Completed';
    const isInProgress = pothole.status === 'In Progress';

    return (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm group hover:shadow-md transition-all">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-bold text-slate-900 mb-1">UNIT: #{pothole.id.slice(0, 8)}</p>
                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        <MapPin size={12} className="text-slate-300" /> {pothole.roadName || pothole.district} Sector
                    </p>
                </div>
                <StatusPill status={pothole.status as any} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={cn(
                    "rounded-xl border p-4",
                    ['High', 'Urgent'].includes(pothole.priority || '') ? "border-rose-100 bg-rose-50/50 text-rose-600" : "border-slate-50 bg-slate-50/50 text-slate-600"
                )}>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Operational Priority</p>
                    <p className="font-bold text-xs">{pothole.priority || 'Medium'}</p>
                </div>
                <div className="rounded-xl border border-slate-50 bg-slate-50/50 p-4">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 text-slate-400 mb-1">Protocol Date</p>
                    <p className="font-bold text-xs text-slate-700">{new Date(pothole.timestamp).toLocaleDateString()}</p>
                </div>
            </div>

            {pothole.maintenanceNotes && (
                <div className="mb-6 rounded-xl bg-slate-50/30 p-4 border border-slate-100/50">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Administrative Observation</p>
                    <p className="text-xs font-medium leading-relaxed text-slate-600">
                        "{pothole.maintenanceNotes}"
                    </p>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={onUpdate}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-black transition-all"
                >
                    <ClipboardEdit size={14} /> Update Progress
                </button>
                
                {!isDone && !isInProgress && (
                    <button
                        onClick={onStart}
                        className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                    >
                        <Play size={14} /> Initiate
                    </button>
                )}

                {isInProgress && (
                    <button
                        onClick={onComplete}
                        className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-bg)] border border-[var(--accent-border)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-text)] hover:opacity-80 transition-all"
                    >
                        <CheckCircle2 size={14} /> Finalize Unit
                    </button>
                )}

                <Link 
                    to={`/staff/reports/${pothole.id}`}
                    className="ml-auto p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100"
                >
                    <Wrench size={16} />
                </Link>
            </div>
        </div>
    );
};;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label>
        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        {children}
    </label>
);

export default RepairsPage;
