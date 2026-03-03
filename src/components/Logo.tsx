import logo from '../assets/logo.png';
import { cn } from '../lib/utils';

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
}

export const Logo = ({ className, iconOnly = false }: LogoProps) => {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <div className="w-10 h-10 flex items-center justify-center group">
                <img
                    src={logo}
                    alt="RoadPulse"
                    className="w-full h-full object-contain group-hover:scale-110 transition-all duration-500 drop-shadow-sm"
                />
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
