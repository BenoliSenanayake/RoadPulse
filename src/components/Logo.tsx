import logo from '../assets/logo.png';
import { cn } from '../lib/utils';

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
}

export const Logo = ({ className, iconOnly = false }: LogoProps) => {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <div className="w-9 h-9 flex items-center justify-center">
                <img
                    src={logo}
                    alt="RoadPulse"
                    className="h-full w-full object-contain"
                />
            </div>
            {!iconOnly && (
                <div className="flex flex-col">
                    <span className="text-base font-semibold leading-none tracking-tight text-slate-950">RoadPulse</span>
                    <span className="mt-0.5 text-[11px] font-medium leading-none text-slate-500">Operations platform</span>
                </div>
            )}
        </div>
    );
};
