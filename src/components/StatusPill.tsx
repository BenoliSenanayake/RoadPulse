import React from 'react';
import { cn } from '../lib/utils';
import { AlertCircle, CheckCircle2, XCircle, Info, Wrench, ShieldAlert } from 'lucide-react';

export type StatusType = 'New' | 'Confirmed' | 'Verified' | 'Scheduled' | 'In Progress' | 'Fixed' | 'Completed' | 'Rejected' | 'Unable to Repair' | 'Discarded' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'VERIFIED_POTHOLE' | 'NEEDS_MANUAL_REVIEW';

interface StatusConfig {
    class: string;
    icon: React.ReactNode;
    label: string;
}

const statusConfig: Record<StatusType, StatusConfig> = {
    'New': {
        class: 'bg-rose-50 text-rose-600 border-rose-100',
        icon: <AlertCircle size={12} />,
        label: 'Discovery'
    },
    'Confirmed': {
        class: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        icon: <CheckCircle2 size={12} />,
        label: 'Verified'
    },
    'Verified': {
        class: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        icon: <CheckCircle2 size={12} />,
        label: 'Verified'
    },
    'Scheduled': {
        class: 'bg-orange-50 text-orange-700 border-orange-100',
        icon: <Wrench size={12} />,
        label: 'Scheduled'
    },
    'In Progress': {
        class: 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm',
        icon: <Wrench size={12} />,
        label: 'In Progress'
    },
    'Fixed': {
        class: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle2 size={12} />,
        label: 'Completed'
    },
    'Completed': {
        class: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle2 size={12} />,
        label: 'Completed'
    },
    'Rejected': {
        class: 'bg-slate-100 text-slate-500 border-slate-200',
        icon: <XCircle size={12} />,
        label: 'Declined'
    },
    'Unable to Repair': {
        class: 'bg-slate-100 text-slate-500 border-slate-200',
        icon: <XCircle size={12} />,
        label: 'Unresolvable'
    },
    'Discarded': {
        class: 'bg-slate-100 text-slate-500 border-slate-200',
        icon: <XCircle size={12} />,
        label: 'Discarded'
    },
    'PENDING': {
        class: 'bg-amber-50 text-amber-700 border-amber-100',
        icon: <ShieldAlert size={12} />,
        label: 'Manual Review'
    },
    'ACCEPTED': {
        class: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        icon: <CheckCircle2 size={12} />,
        label: 'AI-Verified'
    },
    'REJECTED': {
        class: 'bg-slate-100 text-slate-500 border-slate-200',
        icon: <XCircle size={12} />,
        label: 'Rejected'
    },
    'VERIFIED_POTHOLE': {
        class: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        icon: <CheckCircle2 size={12} />,
        label: 'Verified Pothole'
    },
    'NEEDS_MANUAL_REVIEW': {
        class: 'bg-amber-50 text-amber-700 border-amber-100',
        icon: <ShieldAlert size={12} />,
        label: 'Needs Manual Review'
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
            "status-pill inline-flex items-center justify-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest transition-all",
            config.class,
            hideLabel ? "w-6 h-6 p-0 rounded-full border-none shadow-sm" : "",
            className
        )}>
            {showIcon && config.icon}
            {!hideLabel && <span className="leading-none">{config.label}</span>}
        </div>
    );
};
