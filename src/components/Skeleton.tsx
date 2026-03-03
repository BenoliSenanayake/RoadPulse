import { cn } from '../lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circle' | 'rect';
}

export const Skeleton = ({ className, variant = 'rect' }: SkeletonProps) => {
    return (
        <div
            className={cn(
                "skeleton",
                variant === 'circle' && "rounded-full",
                variant === 'text' && "h-3 w-3/4 mb-2",
                className
            )}
        />
    );
};

export const SkeletonCard = () => (
    <div className="card-premium p-6 space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton variant="circle" className="w-12 h-12" />
            <div className="flex-1">
                <Skeleton variant="text" className="w-1/2" />
                <Skeleton variant="text" className="w-1/3" />
            </div>
        </div>
        <Skeleton className="h-32 w-full" />
    </div>
);
