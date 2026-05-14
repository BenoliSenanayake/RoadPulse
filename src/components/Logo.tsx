import logo from '../assets/logo.png';
import { cn } from '../lib/utils';

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
    subtext?: string;
}

export const Logo = ({ className, iconOnly = false, subtext = "Operations platform" }: LogoProps) => {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className="h-10 w-auto flex items-center justify-center">
                <img
                    src={logo}
                    alt="RoadPulse"
                    className="h-full w-full object-contain"
                />
            </div>
            {!iconOnly && (
                <div className="flex flex-col">
                    <span className="text-base font-bold leading-none tracking-tight text-[#0f172a]">RoadPulse</span>
                    <span className="mt-1.5 text-[10px] font-bold leading-none text-[#64748b] uppercase tracking-[0.15em]">{subtext}</span>
                </div>
            )}
        </div>
    );
};
