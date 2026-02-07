import { useState, useMemo, useEffect } from 'react';
import {
    getRuns,
    resolveIssue
} from '../mockData';
import {
    Truck,
    CheckCircle2,
    Activity,
    History,
    PlayCircle,
    Bell,
    HardDrive,
    Cpu,
    Video,
    Navigation
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { InspectionRun, InspectionIssue, IssueType } from '../types';

const ISSUE_ICONS: Record<IssueType, any> = {
    GPS_MISSING: Navigation,
    UPLOAD_STALLED: Activity,
    CAMERA_DISCONNECTED: Video,
    LOW_STORAGE: HardDrive
};

const InspectionRuns = () => {
    const { user } = useAuth();
    const [runs, setRuns] = useState<InspectionRun[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        setRuns(getRuns());
    }, []);

    const activeRuns = runs.filter(r => r.status === 'active');
    const pastRuns = runs.filter(r => r.status !== 'active');

    const handleResolve = (runId: string, issueId: string) => {
        if (!user) return;
        resolveIssue(runId, issueId, user.name);
        setRuns(getRuns()); // Refresh local state
    };

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setRuns(getRuns());
            setIsSyncing(false);
        }, 1000);
    };

    // Notification center logic (aggregate unresolved issues)
    const unresolvedAlerts = useMemo(() => {
        const alerts: { runId: string; issue: InspectionIssue }[] = [];
        activeRuns.forEach(run => {
            run.issues.forEach(issue => {
                if (!issue.resolved) {
                    alerts.push({ runId: run.id, issue });
                }
            });
        });
        return alerts;
    }, [activeRuns]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text uppercase tracking-tighter">Fleet & Stream Telemetry</h1>
                    <p className="text-sm text-gray-500">Real-time edge processing and upload monitoring</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <button className="p-2.5 bg-white border border-border rounded-xl shadow-sm text-gray-600 hover:text-primary transition-all">
                            <Bell size={20} />
                            {unresolvedAlerts.length > 0 && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                            )}
                        </button>
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="btn-primary flex items-center gap-2"
                    >
                        <PlayCircle size={18} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? 'Synchronizing...' : 'Manual Data Sync'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Notification Center / Sidebar */}
                <div className="space-y-6">
                    <div className="card overflow-hidden">
                        <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Active System Alerts</h4>
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-black">{unresolvedAlerts.length}</span>
                        </div>
                        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                            {unresolvedAlerts.length === 0 ? (
                                <div className="p-8 text-center">
                                    <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
                                    <p className="text-xs font-bold text-gray-400 uppercase">All Systems Nominal</p>
                                </div>
                            ) : (
                                unresolvedAlerts.map(({ runId, issue }) => {
                                    const Icon = ISSUE_ICONS[issue.type];
                                    return (
                                        <div key={issue.id} className="p-4 hover:bg-red-50/30 transition-colors">
                                            <div className="flex gap-3">
                                                <div className="p-2 bg-red-100 text-red-600 rounded-lg h-fit">
                                                    <Icon size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black text-red-600 uppercase mb-0.5">{issue.type.replace('_', ' ')}</p>
                                                    <p className="text-[11px] font-bold text-gray-700 leading-tight mb-2">{issue.message}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-bold text-gray-400 capitalize">{runId}</span>
                                                        <button
                                                            onClick={() => handleResolve(runId, issue.id)}
                                                            className="text-[9px] font-black text-primary uppercase hover:underline"
                                                        >
                                                            Resolve
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <div className="card p-5 bg-gray-900 text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <Cpu className="text-primary" size={24} />
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase">Edge Compute Status</p>
                                <p className="text-xs font-bold">Inland Processing Unit 4</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-400">CPU Usage</span>
                                <span className="font-mono">42%</span>
                            </div>
                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[42%]" />
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-400">Storage Capacity</span>
                                <span className="font-mono">82%</span>
                            </div>
                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-[82%]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Feed: Active Runs */}
                <div className="lg:col-span-3 space-y-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={16} className="text-emerald-500" />
                        Active Inspection Feeds
                    </h3>

                    {activeRuns.length === 0 ? (
                        <div className="card p-12 text-center text-gray-400 border-dashed border-2">No vehicles currently transmitting</div>
                    ) : (
                        activeRuns.map(run => (
                            <div key={run.id} className="card p-6 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                                            <Truck size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-black text-text tracking-tight">{run.vehicleId}</h4>
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase animate-pulse">Live Stream</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-500">{run.operatorName} • Sector 4B-Colombo</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Detection Rate</p>
                                            <p className="text-xs font-bold font-mono">1.2/km</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                    <div className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Metadata Sync Progress</span>
                                            <span className="text-xs font-black text-primary">{run.uploadProgress}%</span>
                                        </div>
                                        <div className="w-full h-4 bg-gray-50 border border-border rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000 ease-out shadow-sm"
                                                style={{ width: `${run.uploadProgress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-[9px] font-bold text-gray-400 italic">Connected via 5G Edge Node</span>
                                            <span className="text-[9px] font-bold text-gray-400">Est. completion: 12m</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Unit Diagnostics</span>
                                        <div className="space-y-2">
                                            {run.issues.filter(i => !i.resolved).length === 0 ? (
                                                <div className="flex items-center gap-3 text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                                    <CheckCircle2 size={16} /> Operational
                                                </div>
                                            ) : (
                                                run.issues.filter(i => !i.resolved).map((issue) => {
                                                    const Icon = ISSUE_ICONS[issue.type];
                                                    return (
                                                        <div key={issue.id} className="flex flex-col gap-2 p-3 bg-red-50 border border-red-100 rounded-xl group relative overflow-hidden">
                                                            <div className="flex items-center gap-3">
                                                                <Icon size={14} className="text-red-500 shrink-0" />
                                                                <span className="text-[11px] font-black text-red-700 tracking-tight leading-none">{issue.message}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleResolve(run.id, issue.id)}
                                                                className="text-[10px] font-black text-primary uppercase text-right hover:underline"
                                                            >
                                                                Override / Resolve
                                                            </button>
                                                        </div>
                                                    )
                                                })
                                            )}
                                            {/* Resolved logs (truncated) */}
                                            {run.issues.filter(i => i.resolved).length > 0 && (
                                                <div className="pt-2">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Resolved in this session</p>
                                                    {run.issues.filter(i => i.resolved).map(issue => (
                                                        <div key={issue.id} className="text-[10px] text-gray-400 flex items-center gap-2 mb-1">
                                                            <CheckCircle2 size={10} className="text-emerald-500" />
                                                            <span className="line-through">{issue.type}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mt-8">
                        <History size={16} />
                        Session Archive
                    </h3>
                    <div className="card overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase">Run ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase">Vehicle</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase">Start Time</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {pastRuns.map(run => (
                                    <tr key={run.id} className="text-sm hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-black text-primary uppercase tracking-tighter">{run.id}</td>
                                        <td className="px-6 py-4 font-bold">{run.vehicleId}</td>
                                        <td className="px-6 py-4 text-[11px] text-gray-500">{new Date(run.startTime).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-black uppercase text-gray-500">{run.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InspectionRuns;
