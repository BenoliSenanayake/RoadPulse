import { useState, useEffect } from 'react';
import { listCitizenReports } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CitizenReport } from '../../types';
import { StatusPill } from '../../components/StatusPill';

const MyReports = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'ACCEPTED' | 'REJECTED' | 'PENDING'>('ALL');

    useEffect(() => {
        if (user) {
            const all = listCitizenReports();
            const mine = all.filter(r => r.citizenId === user.id);
            setReports(mine.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
    }, [user]);

    const filteredReports = reports.filter(r => filter === 'ALL' || r.aiStatus === filter);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 pb-32">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">My Reports</h1>
                    <p className="text-slate-500 font-medium">History of your contributions to the national road network.</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                    {['ALL', 'ACCEPTED', 'PENDING', 'REJECTED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                                filter === f ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {filteredReports.length === 0 ? (
                <div className="bg-slate-50 rounded-[3rem] p-20 text-center border border-slate-100 border-dashed">
                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 text-slate-200">
                        <Clock size={32} />
                    </div>
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No telemetry found</p>
                    <p className="text-slate-400 font-medium mt-2">Start by reporting a pothole in your area.</p>
                    <Link to="/citizen" className="inline-flex items-center gap-2 mt-8 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:underline">
                        Launch Command <ArrowRight size={14} />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredReports.map(report => (
                        <Link
                            key={report.id}
                            to={`/citizen/status/${report.id}`}
                            className="group bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-2xl shadow-slate-200/50 flex gap-6 items-start hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-50 shadow-inner shrink-0 relative">
                                <img src={report.imageUrl} alt="" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
                                <div className="absolute top-2 right-2">
                                    <StatusPill status={report.aiStatus as any} hideLabel className="shadow-lg" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 py-1">
                                <div className="flex items-center gap-2 font-mono text-[9px] font-black text-slate-300 mb-2 uppercase tracking-tighter">
                                    <span>#{report.id.split('-')[0]}</span>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                                </div>
                                <h3 className="text-slate-900 font-black tracking-tight mb-2 line-clamp-1">
                                    {report.description || "Road Surface Defect"}
                                </h3>
                                <div className="flex items-center justify-between">
                                    <StatusPill status={report.aiStatus as any} />
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all">
                                        <ArrowRight size={18} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReports;
