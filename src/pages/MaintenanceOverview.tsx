import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CalendarCheck,
    CheckCircle2,
    ClipboardList,
    Clock,
    HardHat,
    MapPin,
    Users,
    Wrench
} from 'lucide-react';
import { potholesApi, reportsApi } from '../lib/api';
import type { CitizenReport, PotholeEvent, RepairTeam } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getProvinceShortName } from '../lib/provinceResolver';

const TEAMS: RepairTeam[] = ['Team A', 'Team B', 'Team C', 'Emergency Team'];

const isSameDay = (value?: string) => {
    if (!value) return false;
    const date = new Date(value);
    const today = new Date();
    return date.getFullYear() === today.getFullYear()
        && date.getMonth() === today.getMonth()
        && date.getDate() === today.getDate();
};

const isOverdue = (pothole: PotholeEvent) => {
    if (!pothole.scheduledDate || ['Completed', 'Fixed', 'Unable to Repair', 'Rejected'].includes(pothole.status)) return false;
    const scheduled = new Date(pothole.scheduledDate);
    const today = new Date();
    scheduled.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return scheduled < today;
};

const getWorkload = (count: number) => {
    if (count <= 1) return { label: 'Available', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (count <= 4) return { label: 'Moderate', className: 'bg-amber-50 text-amber-700 border-amber-100' };
    return { label: 'Busy', className: 'bg-rose-50 text-rose-700 border-rose-100' };
};

const MaintenanceOverview = () => {
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');

        Promise.all([potholesApi.list(), reportsApi.list()])
            .then(([potholeData, reportData]) => {
                // Filter by province for maintenance officers
                if (province && province !== 'Unassigned') {
                    setPotholes(potholeData.filter(p => p.provincialCouncil === province));
                    setReports(reportData.filter(r => r.provincialCouncil === province));
                } else {
                    setPotholes(potholeData);
                    setReports(reportData);
                }
            })
            .catch(() => setError('Unable to load maintenance overview. Please try again.'))
            .finally(() => setLoading(false));
    }, [province]);

    const { cards, todaySummary, teamStats, priorityQueue } = useMemo(() => {
        const newReports = reports.filter(report => report.status === 'New').length;
        const verified = potholes.filter(p => ['Verified', 'Confirmed'].includes(p.status)).length;
        const scheduled = potholes.filter(p => p.status === 'Scheduled').length;
        const inProgress = potholes.filter(p => p.status === 'In Progress').length;
        const completed = potholes.filter(p => ['Completed', 'Fixed'].includes(p.status)).length;
        const overdue = potholes.filter(isOverdue).length;

        const todaysScheduled = potholes.filter(p => isSameDay(p.scheduledDate));
        const highPriorityAwaitingSchedule = potholes.filter(p =>
            ['Verified', 'Confirmed'].includes(p.status)
            && ['High', 'Urgent'].includes(p.priority || 'Medium')
            && !p.assignedTeam
        );
        const activeTeams = new Set(potholes.filter(p =>
            p.assignedTeam && !['Completed', 'Fixed', 'Unable to Repair', 'Rejected'].includes(p.status)
        ).map(p => p.assignedTeam));
        const completedToday = potholes.filter(p => isSameDay(p.completedAt));

        const calculatedTeamStats = TEAMS.map(team => {
            const assigned = potholes.filter(p => p.assignedTeam === team);
            const pending = assigned.filter(p => !['Completed', 'Fixed', 'Unable to Repair', 'Rejected'].includes(p.status));
            const todayJobs = assigned.filter(p => isSameDay(p.scheduledDate));
            const done = assigned.filter(p => ['Completed', 'Fixed'].includes(p.status));
            const workload = getWorkload(pending.length);

            return { team, assigned: assigned.length, pending: pending.length, today: todayJobs.length, completed: done.length, workload };
        });

        return {
            cards: [
                { label: 'New Reports', value: newReports, icon: ClipboardList, color: 'bg-blue-600' },
                { label: 'Verified Potholes', value: verified, icon: CheckCircle2, color: 'bg-emerald-600' },
                { label: 'Scheduled Repairs', value: scheduled, icon: CalendarCheck, color: 'bg-violet-600' },
                { label: 'In Progress Repairs', value: inProgress, icon: Wrench, color: 'bg-amber-500' },
                { label: 'Completed Repairs', value: completed, icon: HardHat, color: 'bg-slate-900' },
                { label: 'Overdue Repairs', value: overdue, icon: AlertTriangle, color: 'bg-rose-600' },
            ],
            todaySummary: {
                todaysScheduled: todaysScheduled.length,
                highPriorityAwaitingSchedule: highPriorityAwaitingSchedule.length,
                activeTeams: activeTeams.size,
                completedToday: completedToday.length,
            },
            teamStats: calculatedTeamStats,
            priorityQueue: highPriorityAwaitingSchedule.slice(0, 5),
        };
    }, [potholes, reports]);

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-100 bg-white p-10 text-center shadow-sm">
                <AlertTriangle className="mx-auto mb-3 text-rose-500" size={32} />
                <h2 className="text-lg font-black text-slate-900">Overview unavailable</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-fade-in-up">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="section-heading mb-1">Maintenance Overview</h1>
                    <p className="text-sm font-bold text-slate-500">Repair coordination, field status, and scheduling priorities.</p>
                </div>
                {province && province !== 'Unassigned' && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                        <MapPin size={12} /> {getProvinceShortName(province)} Province
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map(card => (
                    <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
                                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{loading ? '-' : card.value}</p>
                            </div>
                            <div className={cn('rounded-2xl p-3 text-white shadow-lg', card.color)}>
                                <card.icon size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black text-slate-900">Today's Work Summary</h2>
                            <p className="text-xs font-bold text-slate-400">A quick view of work planned and moving today.</p>
                        </div>
                        <Clock className="text-slate-300" size={22} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <SummaryItem label="Repairs scheduled today" value={todaySummary.todaysScheduled} icon={CalendarCheck} />
                        <SummaryItem label="High-priority awaiting schedule" value={todaySummary.highPriorityAwaitingSchedule} icon={AlertTriangle} />
                        <SummaryItem label="Teams currently assigned" value={todaySummary.activeTeams} icon={Users} />
                        <SummaryItem label="Completed work today" value={todaySummary.completedToday} icon={CheckCircle2} />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-black text-slate-900">Priority Queue</h2>
                    <p className="mb-5 text-xs font-bold text-slate-400">High-priority verified potholes needing a team.</p>
                    <div className="space-y-3">
                        {priorityQueue.length === 0 ? (
                            <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No high-priority potholes are waiting for scheduling.</p>
                        ) : priorityQueue.map(pothole => (
                            <div key={pothole.id} className="rounded-xl border border-slate-100 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-black text-slate-900">{pothole.id}</p>
                                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-rose-700">{pothole.priority}</span>
                                </div>
                                <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <MapPin size={12} /> {pothole.roadName || pothole.district || 'Location pending'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-base font-black text-slate-900">Team Distribution</h2>
                    <p className="text-xs font-bold text-slate-400">Current workload by repair team.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {teamStats.map(stat => (
                        <div key={stat.team} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h3 className="text-sm font-black text-slate-950">{stat.team}</h3>
                                <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest', stat.workload.className)}>
                                    {stat.workload.label}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <MiniMetric label="Assigned" value={stat.assigned} />
                                <MiniMetric label="Today" value={stat.today} />
                                <MiniMetric label="Pending" value={stat.pending} />
                                <MiniMetric label="Completed" value={stat.completed} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

const SummaryItem = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) => (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
        <div className="rounded-xl bg-white p-3 text-emerald-700 shadow-sm">
            <Icon size={18} />
        </div>
        <div>
            <p className="text-2xl font-black text-slate-950">{value}</p>
            <p className="text-xs font-bold text-slate-500">{label}</p>
        </div>
    </div>
);

const MiniMetric = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl bg-white p-3">
        <p className="text-xl font-black text-slate-950">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
);

export default MaintenanceOverview;
