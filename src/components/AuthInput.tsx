import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
    error?: string;
    showPasswordToggle?: boolean;
}

export const AuthInput = ({
    label,
    icon,
    error,
    showPasswordToggle,
    className,
    type,
    ...props
}: AuthInputProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);

    const checkCapsLock = (e: React.KeyboardEvent) => {
        if (e.getModifierState('CapsLock')) {
            setIsCapsLockOn(true);
        } else {
            setIsCapsLockOn(false);
        }
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className="space-y-2 w-full">
            <div className="flex justify-between items-center">
                <label className="ml-1 block text-sm font-medium text-slate-700">
                    {label}
                </label>
                {type === 'password' && isCapsLockOn && (
                    <span className="flex items-center gap-1 text-xs font-medium text-rose-600">
                        <AlertCircle size={10} /> Caps Lock On
                    </span>
                )}
            </div>

            <div className="relative group">
                {icon && (
                    <div className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300",
                        error ? "text-rose-400" : "text-slate-300 group-focus-within:text-slate-900"
                    )}>
                        {React.isValidElement<{ size?: number }>(icon) ? React.cloneElement(icon, { size: 18 }) : icon}
                    </div>
                )}

                <input
                    {...props}
                    type={inputType}
                    onKeyUp={checkCapsLock}
                    className={cn(
                        "w-full rounded-lg border bg-white text-sm font-medium transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2",
                        icon ? "pl-12" : "pl-5",
                        showPasswordToggle ? "pr-12" : "pr-5",
                        "py-3",
                        error
                            ? "border-rose-300 text-rose-900 focus:ring-rose-100"
                            : "border-slate-300 text-slate-900 focus:border-slate-500 focus:ring-slate-200",
                        className
                    )}
                />

                {showPasswordToggle && type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors duration-200"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {error && (
                <p className="ml-1.5 mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                    <AlertCircle size={10} /> {error}
                </p>
            )}
        </div>
    );
};
