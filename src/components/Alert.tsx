import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
    type: AlertType;
    message: string;
    description?: string;
    onClose?: () => void;
    autoClose?: boolean;
    duration?: number;
    className?: string;
}

export const Alert = ({
    type,
    message,
    description,
    onClose,
    autoClose = true,
    duration = 5000,
    className
}: AlertProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                onClose?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [autoClose, duration, onClose]);

    if (!isVisible) return null;

    const icons = {
        success: <CheckCircle2 className="text-emerald-500" size={20} />,
        error: <AlertCircle className="text-rose-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
        warning: <AlertTriangle className="text-amber-500" size={20} />,
    };

    const styles = {
        success: "bg-emerald-50 border-emerald-100 text-emerald-900",
        error: "bg-rose-50 border-rose-100 text-rose-900",
        info: "bg-blue-50 border-blue-100 text-blue-900",
        warning: "bg-amber-50 border-amber-100 text-amber-900",
    };

    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-[60] flex items-start gap-4 p-4 rounded-2xl border shadow-premium animate-fade-in-up max-w-sm",
            styles[type],
            className
        )}>
            <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black uppercase tracking-tight">{message}</h4>
                {description && <p className="text-xs font-medium opacity-80 mt-1">{description}</p>}
            </div>
            <button
                onClick={() => {
                    setIsVisible(false);
                    onClose?.();
                }}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close alert"
            >
                <X size={18} />
            </button>
        </div>
    );
};
