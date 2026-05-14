import React from 'react';
import { cn } from '../lib/utils';
import { AlertCircle, CheckCircle2, XCircle, Wrench, ShieldAlert, Clock } from 'lucide-react';

export type StatusType = 'New' | 'Confirmed' | 'Verified' | 'Scheduled' | 'In Progress' | 'Fixed' | 'Completed' | 'Rejected' | 'Unable to Repair' | 'Discarded' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'VERIFIED_POTHOLE' | 'NEEDS_MANUAL_REVIEW';

interface StatusConfig {
    class: string;
    icon: React.ReactNode;
    staffLabel: string;
    citizenLabel: string;
    citizenClass?: string;
}

const statusConfig: Record<string, StatusConfig> = {
    'New': {
        class: 'status-pending',
        icon: <AlertCircle size={11} />,
        staffLabel: 'New',
        citizenLabel: 'Submitted',
        citizenClass: 'citizen-submitted'
    },
    'PENDING': {
        class: 'status-pending',
        icon: <AlertCircle size={11} />,
        staffLabel: 'Pending',
        citizenLabel: 'Submitted',
        citizenClass: 'citizen-submitted'
    },
    'Confirmed': {
        class: 'status-positive',
        icon: <CheckCircle2 size={11} />,
        staffLabel: 'Confirmed',
        citizenLabel: 'Verified',
        citizenClass: 'citizen-verified'
    },
    'Verified': {
        class: 'status-positive',
        icon: <CheckCircle2 size={11} />,
        staffLabel: 'Verified',
        citizenLabel: 'Verified',
        citizenClass: 'citizen-verified'
    },
    'VERIFIED_POTHOLE': {
        class: 'status-positive',
        icon: <CheckCircle2 size={11} />,
        staffLabel: 'Verified',
        citizenLabel: 'Verified',
        citizenClass: 'citizen-verified'
    },
    'ACCEPTED': {
        class: 'status-positive',
        icon: <CheckCircle2 size={11} />,
        staffLabel: 'Accepted',
        citizenLabel: 'Verified',
        citizenClass: 'citizen-verified'
    },
    'Scheduled': {
        class: 'status-progress',
        icon: <Clock size={11} />,
        staffLabel: 'Scheduled',
        citizenLabel: 'Scheduled',
        citizenClass: 'citizen-scheduled'
    },
    'In Progress': {
        class: 'status-progress',
        icon: <Wrench size={11} />,
        staffLabel: 'In Progress',
        citizenLabel: 'In Progress',
        citizenClass: 'citizen-progress'
    },
    'Fixed': {
        class: 'status-positive',
        icon: <CheckCircle2 size={11} />,
        staffLabel: 'Fixed',
        citizenLabel: 'Fixed',
        citizenClass: 'citizen-fixed'
    },
    'Completed': {
        class: 'status-positive',
        icon: <CheckCircle2 size={11} />,
        staffLabel: 'Completed',
        citizenLabel: 'Fixed',
        citizenClass: 'citizen-fixed'
    },
    'Rejected': {
        class: 'status-negative',
        icon: <XCircle size={11} />,
        staffLabel: 'Rejected',
        citizenLabel: 'Rejected',
        citizenClass: 'citizen-rejected'
    },
    'REJECTED': {
        class: 'status-negative',
        icon: <XCircle size={11} />,
        staffLabel: 'Rejected',
        citizenLabel: 'Rejected',
        citizenClass: 'citizen-rejected'
    },
    'Unable to Repair': {
        class: 'status-negative',
        icon: <XCircle size={11} />,
        staffLabel: 'Unable to Repair',
        citizenLabel: 'Rejected',
        citizenClass: 'citizen-rejected'
    },
    'Discarded': {
        class: 'status-negative',
        icon: <XCircle size={11} />,
        staffLabel: 'Discarded',
        citizenLabel: 'Rejected',
        citizenClass: 'citizen-rejected'
    },
    'NEEDS_MANUAL_REVIEW': {
        class: 'status-pending',
        icon: <ShieldAlert size={11} />,
        staffLabel: 'Review',
        citizenLabel: 'Under Review',
        citizenClass: 'citizen-review'
    }
};

interface StatusPillProps {
    status: string;
    label?: string;
    className?: string;
    showIcon?: boolean;
    hideLabel?: boolean;
    variant?: 'citizen' | 'staff';
}

export const StatusPill = ({ status, label, className, showIcon = true, hideLabel = false, variant = 'staff' }: StatusPillProps) => {
    const config = statusConfig[status] || {
        class: 'status-pending',
        icon: <AlertCircle size={11} />,
        staffLabel: status,
        citizenLabel: status,
        citizenClass: 'status-pending'
    };

    const isCitizen = variant === 'citizen';
    const displayLabel = label || (isCitizen ? config.citizenLabel : config.staffLabel);
    const displayClass = isCitizen ? (config.citizenClass || config.class) : config.class;

    return (
        <div className={cn(
            "status-pill inline-flex items-center justify-center gap-1.5 shrink-0 transition-all",
            displayClass,
            hideLabel ? "w-6 h-6 p-0 rounded-full" : "px-2.5 py-0.5",
            className
        )}>
            {showIcon && React.isValidElement<{ size?: number }>(config.icon) ? React.cloneElement(config.icon, { size: 11 }) : config.icon}
            {!hideLabel && <span className="leading-none">{displayLabel}</span>}
        </div>
    );
};
