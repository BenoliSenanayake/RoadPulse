import React from 'react';
import { cn } from '../lib/utils';
import { AlertCircle, CheckCircle2, Calendar, XCircle, Info } from 'lucide-react';

export type StatusType = 'New' | 'Confirmed' | 'Verified' | 'Scheduled' | 'In Progress' | 'Fixed' | 'Completed' | 'Rejected' | 'Unable to Repair' | 'Discarded' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface StatusConfig {
    class: string;
    icon: React.ReactNode;
    label: string;
}

const statusConfig: Record<StatusType, StatusConfig> = {
    'New': {
        class: 'status-new',
        icon: <AlertCircle size={12} />,
        label: 'New Detection'
    },
    'Confirmed': {
        class: 'status-confirmed',
        icon: <CheckCircle2 size={12} />,
        label: 'Confirmed'
    },
    'Verified': {
        class: 'status-confirmed',
        icon: <CheckCircle2 size={12} />,
        label: 'Verified'
    },
    'Scheduled': {
        class: 'status-scheduled',
        icon: <Calendar size={12} />,
        label: 'Scheduled'
    },
    'In Progress': {
        class: 'status-scheduled',
        icon: <Calendar size={12} />,
        label: 'In Progress'
    },
    'Fixed': {
        class: 'status-fixed',
        icon: <CheckCircle2 size={12} />,
        label: 'Resolved'
    },
    'Completed': {
        class: 'status-fixed',
        icon: <CheckCircle2 size={12} />,
        label: 'Completed'
    },
    'Rejected': {
        class: 'status-rejected',
        icon: <XCircle size={12} />,
        label: 'Rejected'
    },
    'Unable to Repair': {
        class: 'status-rejected',
        icon: <XCircle size={12} />,
        label: 'Unable'
    },
    'Discarded': {
        class: 'status-rejected',
        icon: <XCircle size={12} />,
        label: 'Discarded'
    },
    'PENDING': {
        class: 'status-new',
        icon: <AlertCircle size={12} />,
        label: 'Under Review'
    },
    'ACCEPTED': {
        class: 'status-confirmed',
        icon: <CheckCircle2 size={12} />,
        label: 'Verified'
    },
    'REJECTED': {
        class: 'status-rejected',
        icon: <XCircle size={12} />,
        label: 'Not Accepted'
    }
};

interface StatusPillProps {
    status: StatusType;
    className?: string;
    showIcon?: boolean;
    hideLabel?: boolean;
}

export const StatusPill = ({ status, className, showIcon = true, hideLabel = false }: StatusPillProps) => {
    const config = statusConfig[status] || {
        class: 'bg-slate-100 text-slate-500 border-slate-200',
        icon: <Info size={12} />,
        label: status
    };

    return (
        <div className={cn(
            "status-pill inline-flex items-center justify-center gap-1.5 shrink-0",
            config.class,
            hideLabel ? "w-6 h-6 p-0 rounded-full border-none shadow-sm" : "",
            className
        )}>
            {showIcon && config.icon}
            {!hideLabel && <span className="leading-none">{config.label}</span>}
        </div>
    );
};
