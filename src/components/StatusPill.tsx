import React from 'react';
import { cn } from '../lib/utils';
import { AlertCircle, CheckCircle2, Calendar, XCircle, Info } from 'lucide-react';

export type StatusType = 'New' | 'Confirmed' | 'Scheduled' | 'Fixed' | 'Rejected' | 'Discarded' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

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
    'Scheduled': {
        class: 'status-scheduled',
        icon: <Calendar size={12} />,
        label: 'Scheduled'
    },
    'Fixed': {
        class: 'status-fixed',
        icon: <CheckCircle2 size={12} />,
        label: 'Resolved'
    },
    'Rejected': {
        class: 'status-rejected',
        icon: <XCircle size={12} />,
        label: 'Rejected'
    },
    'Discarded': {
        class: 'status-rejected',
        icon: <XCircle size={12} />,
        label: 'Discarded'
    },
    'PENDING': {
        class: 'status-new',
        icon: <AlertCircle size={12} />,
        label: 'Audit: Pending'
    },
    'ACCEPTED': {
        class: 'status-confirmed',
        icon: <CheckCircle2 size={12} />,
        label: 'Audit: Accepted'
    },
    'REJECTED': {
        class: 'status-rejected',
        icon: <XCircle size={12} />,
        label: 'Audit: Rejected'
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
