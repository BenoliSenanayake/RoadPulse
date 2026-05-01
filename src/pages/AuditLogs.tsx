import { useEffect, useMemo, useState } from 'react';
import { FileClock, Filter, ShieldAlert } from 'lucide-react';
import { auditLogsApi } from '../lib/api';
import type { AuditLog } from '../types';
import { ResponsiveDataList } from '../components/ResponsiveDataList';

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [filterAction, setFilterAction] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL');

    useEffect(() => {
        auditLogsApi.list().then(setLogs);
    }, []);

    const filteredLogs = useMemo(() => {
        return logs
            .filter((log) => filterAction === 'ALL' || log.action === filterAction)
            .filter((log) => filterType === 'ALL' || log.entityType === filterType)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [filterAction, filterType, logs]);

    const columns = [
        {
            header: 'Timestamp',
            render: (log: AuditLog) => (
                <span className="font-mono text-xs font-bold text-slate-500">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            )
        },
        {
            header: 'Actor',
            render: (log: AuditLog) => (
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900">{log.actorName || 'RoadPulse System'}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{log.actor.replace('_', ' ')}</span>
                </div>
            )
        },
        {
            header: 'Action',
            render: (log: AuditLog) => (
                <div className="flex flex-col gap-2">
                    <span className="w-fit rounded-lg bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-200">
                        {log.action.replace('_', ' ')}
                    </span>
                    <span className="max-w-xl truncate text-sm font-bold text-slate-600">{log.details}</span>
                </div>
            )
        },
        {
            header: 'Entity',
            className: 'text-right',
            render: (log: AuditLog) => (
                <div className="flex flex-col items-end gap-1">
                    <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        {log.entityType}
                    </span>
                    <span className="font-mono text-[10px] font-black text-slate-300">{log.entityId}</span>
                </div>
            )
        }
    ];

    const renderCard = (log: AuditLog) => (
        <div className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-mono text-[10px] font-black text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <h3 className="mt-1 text-sm font-black text-slate-900">{log.actorName || 'RoadPulse System'}</h3>
                </div>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-700">
                    {log.entityType}
                </span>
            </div>
            <span className="inline-flex rounded-lg bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-200">
                {log.action.replace('_', ' ')}
            </span>
            <p className="text-xs font-bold leading-relaxed text-slate-600">{log.details}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200 shadow-xl shadow-slate-900/15">
                        <FileClock size={22} />
                    </div>
                    <h1 className="section-heading mb-1">Audit Logs</h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Immutable activity trail for reports, potholes, and system decisions</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Filter size={13} />
                        Filters
                    </div>
                    <select
                        value={filterType}
                        onChange={(event) => setFilterType(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                    >
                        <option value="ALL">All Entities</option>
                        <option value="REPORT">Reports</option>
                        <option value="POTHOLE">Potholes</option>
                    </select>
                    <select
                        value={filterAction}
                        onChange={(event) => setFilterAction(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                    >
                        <option value="ALL">All Actions</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="AI_ACCEPTED">AI Accepted</option>
                        <option value="AI_REJECTED">AI Rejected</option>
                        <option value="MANUAL_ACCEPTED">Manual Accepted</option>
                        <option value="MANUAL_REJECTED">Manual Rejected</option>
                        <option value="STATUS_CHANGED">Status Changed</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
                {filteredLogs.length > 0 ? (
                    <ResponsiveDataList
                        data={filteredLogs}
                        columns={columns}
                        renderCard={renderCard}
                        keyExtractor={(log) => log.id}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <ShieldAlert size={24} />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">No audit records found</h2>
                        <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500">
                            Try a different filter set, or generate activity by reviewing reports and updating repair statuses.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
