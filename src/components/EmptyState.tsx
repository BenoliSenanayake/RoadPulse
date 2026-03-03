import React from 'react';
import { Search, Inbox, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: 'search' | 'inbox' | 'alert' | React.ElementType;
    className?: string;
    action?: React.ReactNode;
}

export const EmptyState = ({
    title,
    description,
    icon = 'inbox',
    className,
    action
}: EmptyStateProps) => {
    const renderIcon = () => {
        if (typeof icon === 'string') {
            const icons = {
                search: <Search size={40} className="text-slate-300" />,
                inbox: <Inbox size={40} className="text-slate-300" />,
                alert: <AlertCircle size={40} className="text-slate-300" />
            };
            return icons[icon as keyof typeof icons];
        }
        const IconComponent = icon as React.ElementType;
        return <IconComponent size={40} className="text-slate-300" />;
    };

    return (
        <div className={cn("flex flex-col items-center justify-center p-12 text-center animate-fade-in-up", className)}>
            <div className="relative mb-6">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center">
                    {renderIcon()}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white border-2 border-slate-50 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-200 rounded-full" />
                </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase">{title}</h3>
            {description && (
                <p className="text-slate-500 max-w-xs font-bold text-sm leading-relaxed mb-8">
                    {description}
                </p>
            )}

            {action && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                    {action}
                </div>
            )}
        </div>
    );
};
