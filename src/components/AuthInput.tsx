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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 lowercase first-letter:uppercase">
                    {label}
                </label>
                {type === 'password' && isCapsLockOn && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
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
                        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
                    </div>
                )}

                <input
                    {...props}
                    type={inputType}
                    onKeyUp={checkCapsLock}
                    className={cn(
                        "w-full bg-slate-50/50 border rounded-2xl focus:outline-none focus:ring-4 transition-all text-sm font-bold placeholder:text-slate-300 placeholder:font-medium",
                        icon ? "pl-12" : "pl-5",
                        showPasswordToggle ? "pr-12" : "pr-5",
                        "py-4",
                        error
                            ? "border-rose-200 focus:ring-rose-500/10 text-rose-900"
                            : "border-slate-100 focus:ring-slate-900/5 text-slate-900",
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
                <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-2 tracking-wide uppercase flex items-center gap-1.5 animate-fade-in">
                    <AlertCircle size={10} /> {error}
                </p>
            )}
        </div>
    );
};
