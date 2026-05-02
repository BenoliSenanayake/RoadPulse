import { useState, useEffect } from 'react';
import { checkBackendHealth } from '../lib/api';
import { 
    Save, 
    Server, 
    ShieldCheck, 
    Map, 
    FileText, 
    Activity, 
    Globe, 
    CheckCircle2, 
    ChevronRight,
    Terminal,
    RefreshCw,
    Clock,
    MessageSquare,
    Cpu,
    Database
} from 'lucide-react';
import { cn } from '../lib/utils';

const Settings = () => {
    const [isApiOnline, setIsApiOnline] = useState<boolean | null>(null);
    const [notes, setNotes] = useState(() => localStorage.getItem('rp_admin_notes') || '');
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkHealth = async () => {
            const online = await checkBackendHealth();
            setIsApiOnline(online);
        };
        checkHealth();
    }, []);

    const handleSaveNotes = () => {
        setLoading(true);
        localStorage.setItem('rp_admin_notes', notes);
        setTimeout(() => {
            setLoading(false);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }, 800);
    };

    const provinceData = [
        { name: 'Western Provincial Council', districts: ['Colombo', 'Gampaha', 'Kalutara'] },
        { name: 'Central Provincial Council', districts: ['Kandy', 'Matale', 'Nuwara Eliya'] },
        { name: 'Southern Provincial Council', districts: ['Galle', 'Matara', 'Hambantota'] },
        { name: 'Northern Provincial Council', districts: ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'] },
        { name: 'Eastern Provincial Council', districts: ['Trincomalee', 'Batticaloa', 'Ampara'] },
    ];

    return (
        <div className="space-y-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-heading">System Parameters</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Core platform configuration & jurisdictional protocols</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-premium bg-white text-slate-600 border border-slate-100 shadow-sm hover:bg-slate-50">
                        <Terminal size={14} className="text-slate-400" />
                        Console View
                    </button>
                    <button onClick={() => window.location.reload()} className="btn-premium bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800">
                        <RefreshCw size={14} className="text-blue-400" />
                        Reboot Session
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column: System Info & Notes */}
                <div className="space-y-8">
                    {/* System Information */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-slate-950 text-blue-400 rounded-2xl shadow-xl">
                                <Server size={22} />
                            </div>
                            <div>
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Infrastructure Metadata</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Environment & API status monitor</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-50">
                                <div className="flex items-center gap-3">
                                    <Globe size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Application Name</span>
                                </div>
                                <span className="text-sm font-black text-slate-900 tracking-tight">RoadPulse CommandCenter</span>
                            </div>
                            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-50">
                                <div className="flex items-center gap-3">
                                    <Cpu size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Environment</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">Production Staging</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-50">
                                <div className="flex items-center gap-3">
                                    <Activity size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">API Diagnostics</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isApiOnline === null ? (
                                        <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
                                    ) : isApiOnline ? (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[10px] font-black text-emerald-600 uppercase">Operational</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                            <span className="text-[10px] font-black text-rose-600 uppercase">Mock Mode</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Administrative Notes</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal system annotations</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleSaveNotes}
                                disabled={loading}
                                className={cn(
                                    "btn-premium px-4 py-2 text-[9px] shadow-lg transition-all duration-500",
                                    isSaved ? "bg-emerald-500 text-white" : "bg-slate-900 text-white shadow-slate-900/10"
                                )}
                            >
                                {loading ? <RefreshCw className="animate-spin" size={14} /> : isSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                                {isSaved ? "Synchronized" : "Commit Changes"}
                            </button>
                        </div>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Type administrative instructions here..."
                            className="w-full h-48 p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all resize-none custom-scrollbar"
                        />
                    </div>
                </div>

                {/* Right Column: Routing & Rules */}
                <div className="space-y-8">
                    {/* Routing Protocols */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <Map size={20} />
                            </div>
                            <div>
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Jurisdictional Routing</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">District assignment protocols</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                            {provinceData.map((province, idx) => (
                                <div key={idx} className="p-5 bg-slate-50/50 rounded-3xl border border-slate-50 group hover:bg-white hover:border-blue-100 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{province.name}</span>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {province.districts.map((d, dIdx) => (
                                            <span key={dIdx} className="px-2.5 py-1 bg-white rounded-lg text-[9px] font-black text-slate-400 uppercase border border-slate-100">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Report Thresholds */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Oversight Protocols</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global lifecycle thresholds</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-50">
                                <div className="flex items-center gap-3">
                                    <Clock size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Overdue Threshold</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">14 Operations Days</span>
                            </div>
                            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-50">
                                <div className="flex items-center gap-3">
                                    <Database size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Retention</span>
                                    <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase">Max</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">Endless Audit</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Status Banner */}
            <div className="bg-slate-950 p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-slate-950/30 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                    <Database size={180} />
                </div>
                <div className="relative z-10 flex items-center gap-8">
                    <div className="h-20 w-20 bg-white/5 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-inner">
                        <FileText size={36} className="text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black uppercase tracking-tight">System Identity</h4>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Version 1.2.4 Build 8820 &bull; Kernel: RoadPulse-OS</p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        All Modules Operational
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
