import React from 'react';
import { cn } from '../lib/utils';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

interface Column<T> {
    header: string;
    className?: string;
    render?: (item: T) => React.ReactNode;
}

interface ResponsiveDataListProps<T> {
    data: T[];
    columns: Column<T>[];
    renderCard: (item: T) => React.ReactNode;
    keyExtractor: (item: T) => string;
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyState?: React.ReactNode;
    className?: string;
}

export function ResponsiveDataList<T>({
    data,
    columns,
    renderCard,
    keyExtractor,
    onRowClick,
    isLoading,
    emptyState,
    className
}: ResponsiveDataListProps<T>) {
    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                        <Skeleton variant="circle" className="w-12 h-12 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-xl" />
                    </div>
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return emptyState || (
            <EmptyState
                icon="search"
                title="No match found"
                description="Try adjusting your filters to find what you're looking for."
            />
        );
    }

    return (
        <div className={cn("overflow-hidden", className)}>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={cn(
                                        "px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100",
                                        col.className
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                onClick={() => onRowClick?.(item)}
                                className={cn(
                                    "transition-all duration-200 group",
                                    onRowClick ? "cursor-pointer hover:bg-slate-50/50" : ""
                                )}
                            >
                                {columns.map((col, i) => (
                                    <td
                                        key={i}
                                        className={cn(
                                            "px-6 py-4 whitespace-nowrap",
                                            col.className
                                        )}
                                    >
                                        {col.render ? col.render(item) : (item as any)[col.header.toLowerCase()]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card-List View */}
            <div className="md:hidden divide-y divide-slate-100">
                {data.map((item) => (
                    <div
                        key={keyExtractor(item)}
                        onClick={() => onRowClick?.(item)}
                        className={cn(
                            "transition-colors",
                            onRowClick ? "active:bg-slate-50 cursor-pointer" : ""
                        )}
                    >
                        {renderCard(item)}
                    </div>
                ))}
            </div>
        </div>
    );
}
