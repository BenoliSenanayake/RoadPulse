import { useMemo } from 'react';
import { listPotholes } from '../lib/api';
import {
    Wrench,
    Calendar,
    Clock,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const RepairsPage = () => {
    const potholes = useMemo(() => listPotholes(), []);

    // Filter for items that need repair or are being repaired
    const repairQueue = useMemo(() => {
        return potholes.filter(p => ['Confirmed', 'Scheduled'].includes(p.status));
    }, [potholes]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text">Maintenance Workflow</h1>
                    <p className="text-sm text-gray-500">Scheduled and confirmed repairs queue</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white border border-border px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        {potholes.filter(p => p.status === 'Confirmed').length} Confirmed
                    </div>
                    <div className="bg-white border border-border px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        {potholes.filter(p => p.status === 'Scheduled').length} Scheduled
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repairQueue.length === 0 ? (
                    <div className="col-span-full card p-12 text-center text-gray-500 italic">No items in the repair queue.</div>
                ) : (
                    repairQueue.map(p => (
                        <div key={p.id} className="card hover:shadow-md transition-shadow cursor-default">
                            <div className="p-4 border-b border-border flex items-center justify-between bg-gray-50/30">
                                <span className="text-sm font-black text-primary uppercase tracking-tighter">{p.id}</span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-black uppercase text-white",
                                    p.status === 'Confirmed' ? 'bg-amber-500' : 'bg-purple-500'
                                )}>
                                    {p.status}
                                </span>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="flex gap-3">
                                    <div className="p-2 rounded-lg bg-gray-100 text-gray-400 shrink-0 h-fit"><Wrench size={16} /></div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Assigned To</p>
                                        <p className="text-sm font-bold">Western Province Team B</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold mb-1 truncate">{p.roadName}</p>
                                    <p className="text-xs text-gray-500">{p.district}</p>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-border pt-4">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        Next Week
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        08:00 AM
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-3 bg-gray-50 border-t border-border flex justify-end">
                                <Link
                                    to={`/potholes/${p.id}`}
                                    className="flex items-center gap-1 text-[11px] font-black text-primary uppercase hover:opacity-80 transition-all"
                                >
                                    Manage Workflow
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RepairsPage;
