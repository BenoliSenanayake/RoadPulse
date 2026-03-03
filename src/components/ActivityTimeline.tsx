import { formatDistanceToNow, parseISO } from 'date-fns';
import { getAuditLogs } from '../mockData';
import type { AuditLogAction } from '../types';
import {
    Send,
    Bot,
    UserCheck,
    UserX,
    Activity,
    Clock,
    FileText
} from 'lucide-react';

interface ActivityTimelineProps {
    entityId: string;
}

const getActionConfig = (action: AuditLogAction) => {
    switch (action) {
        case 'SUBMITTED':
            return { icon: Send, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Report Submitted' };
        case 'AI_ACCEPTED':
            return { icon: Bot, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'AI Validation Passed' };
        case 'AI_REJECTED':
            return { icon: Bot, color: 'text-red-500', bg: 'bg-red-100', label: 'AI Validation Failed' };
        case 'MANUAL_ACCEPTED':
            return { icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Manually Accepted' };
        case 'MANUAL_REJECTED':
            return { icon: UserX, color: 'text-red-600', bg: 'bg-red-100', label: 'Manually Rejected' };
        case 'STATUS_CHANGED':
            return { icon: Activity, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Status Update' };
        default:
            return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100', label: 'System Action' };
    }
};

const getActorRoleStyle = (actor: string) => {
    switch (actor) {
        case 'SYSTEM': return 'bg-gray-800 text-white';
        case 'CITIZEN': return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'MAINTENANCE_OFFICER': return 'bg-orange-100 text-orange-800 border border-orange-200';
        case 'ADMIN': return 'bg-purple-100 text-purple-800 border border-purple-200';
        default: return 'bg-gray-100 text-gray-800';
    }
}

export const ActivityTimeline = ({ entityId }: ActivityTimelineProps) => {
    // Fetch and sort logs securely by the provided entity ID
    const sysLogs = getAuditLogs()
        .filter(log => log.entityId === entityId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (sysLogs.length === 0) return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
            <Clock className="text-gray-400 mb-2" size={24} />
            <p className="text-sm font-medium text-gray-500">No activity recorded for this record yet.</p>
        </div>
    );

    return (
        <div className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 tracking-tight">Activity Timeline</h3>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">Chronological Audit Trail</p>
                </div>
                <div className="p-2 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-400">
                    <Activity size={18} />
                </div>
            </div>

            <div className="p-6">
                <div className="relative border-l-2 border-gray-100 pl-6 space-y-8 ml-3">
                    {sysLogs.map((log) => {
                        const config = getActionConfig(log.action);
                        const Icon = config.icon;

                        return (
                            <div key={log.id} className="relative">
                                {/* Timeline Node Indicator */}
                                <div className={`absolute -left-[35px] w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white ${config.bg} ${config.color} shadow-sm z-10`}>
                                    <Icon size={14} strokeWidth={2.5} />
                                </div>

                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-sm text-gray-900">{config.label}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
                                            {formatDistanceToNow(parseISO(log.timestamp), { addSuffix: true })}
                                        </span>
                                    </div>

                                    {log.details && (
                                        <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {log.details}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getActorRoleStyle(log.actor)}`}>
                                            {log.actor.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs font-bold text-gray-500">
                                            • {log.actorName || 'System Process'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
