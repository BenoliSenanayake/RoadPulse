import { useMemo } from 'react';
import { listPotholes } from '../lib/api';
import {
    Wrench,
    Calendar,
    Clock,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusPill } from '../components/StatusPill';
import { EmptyState } from '../components/EmptyState';

const RepairsPage = () => {
    const potholes = useMemo(() => listPotholes(), []);

    // Filter for items that need repair or are being repaired
    const repairQueue = useMemo(() => {
        return potholes.filter(p => ['Confirmed', 'Scheduled'].includes(p.status));
    }, [potholes]);

    return (
        <div className="space-y-8 pb-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="section-heading mb-1">Maintenance Operations</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active repair sequence and tactical scheduling</p>
                </div>
                <div className="flex gap-3">
                    <div className="card-premium px-6 py-3 border-none flex items-center gap-3 shadow-lg shadow-slate-900/5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{potholes.filter(p => p.status === 'Confirmed').length} Confirmed</span>
                    </div>
                    <div className="card-premium px-6 py-3 border-none flex items-center gap-3 shadow-lg shadow-slate-900/5">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{potholes.filter(p => p.status === 'Scheduled').length} Scheduled</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {repairQueue.length === 0 ? (
                    <div className="col-span-full py-20">
                        <EmptyState
                            title="Queue Depleted"
                            description="All sectors nominal. No pending repairs found in the active maintenance sequence."
                            icon={Wrench}
                        />
                    </div>
                ) : (
                    repairQueue.map(p => (
                        <div key={p.id} className="card-premium overflow-hidden border-none shadow-premium group hover-lift transition-all duration-500">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{p.id.split('-')[0]}</span>
                                <StatusPill status={p.status as any} />
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="flex gap-4">
                                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shrink-0 h-fit">
                                        <Wrench size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-300 font-black tracking-widest leading-none mb-1.5 uppercase">Dispatch Unit</p>
                                        <p className="text-xs font-black text-slate-900 tracking-tight">Province Team B</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-black text-slate-900 mb-1 truncate tracking-tight">{p.roadName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.district}</p>
                                </div>

                                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-300 border-t border-slate-50 pt-6">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="opacity-50" />
                                        Next Week
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="opacity-50" />
                                        08:00
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex justify-end">
                                <Link
                                    to={`/potholes/${p.id}`}
                                    className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-accent transition-all group/link"
                                >
                                    Manage Command
                                    <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
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
