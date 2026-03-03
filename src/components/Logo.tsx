import { Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
}

export const Logo = ({ className, iconOnly = false }: LogoProps) => {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20 group">
                <Activity size={20} className="text-accent animate-pulse group-hover:scale-110 transition-transform" />
            </div>
            {!iconOnly && (
                <div className="flex flex-col">
                    <span className="text-lg font-black text-slate-900 tracking-tighter leading-none uppercase">RoadPulse</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-0.5">Tactical Intel</span>
                </div>
            )}
        </div>
    );
};
