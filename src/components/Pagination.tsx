import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    limit?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    limit = 10
}) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalItems || 0);

    const getPageNumbers = () => {
        const pages = [];
        const showMax = 5;
        
        let start = Math.max(1, currentPage - Math.floor(showMax / 2));
        let end = Math.min(totalPages, start + showMax - 1);
        
        if (end === totalPages) {
            start = Math.max(1, end - showMax + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {totalItems ? (
                    <>Showing <span className="text-slate-900">{startItem}</span> - <span className="text-slate-900">{endItem}</span> of <span className="text-slate-900">{totalItems}</span> results</>
                ) : (
                    <>Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span></>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-slate-900 hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronsLeft size={16} />
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-slate-900 hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1 mx-2">
                    {getPageNumbers().map(page => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={cn(
                                "w-10 h-10 rounded-xl text-xs font-black transition-all",
                                currentPage === page
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                    : "bg-white border border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-900"
                            )}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-slate-900 hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-slate-900 hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    );
};
