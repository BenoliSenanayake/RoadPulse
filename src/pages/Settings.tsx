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
                    <p className="mt-2 text-sm text-slate-600">Core platform configuration and jurisdictional protocols.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-premium bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50">
                        <Terminal size={14} className="text-slate-400" />
                        Console View
                    </button>
                    <button onClick={() => window.location.reload()} className="btn-premium bg-slate-900 text-white shadow-md hover:bg-slate-800">
                        <RefreshCw size={14} className="text-[var(--accent-solid)]" />
                        Refresh Session
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column: System Info & Notes */}
                <div className="space-y-8">
                    {/* System Information */}
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md">
                                <Server size={20} />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Infrastructure Metadata</h2>
                                <p className="text-[10px] font-medium text-slate-400">Environment & API status monitor</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Globe size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Application</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">RoadPulse CommandCenter</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Cpu size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Environment</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-[var(--accent-bg)] text-[var(--accent-text)] rounded text-[9px] font-bold uppercase tracking-wider">Production</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Activity size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Status</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isApiOnline === null ? (
                                        <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
                                    ) : isApiOnline ? (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success-text)] animate-pulse" />
                                            <span className="text-[10px] font-bold text-[var(--success-text)] uppercase tracking-wider">Operational</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--danger-text)]" />
                                            <span className="text-[10px] font-bold text-[var(--danger-text)] uppercase tracking-wider">Mock Mode</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="card-premium p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-[var(--accent-bg)] text-[var(--accent-text)] rounded-xl">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Administrative Notes</h2>
                                    <p className="text-[10px] font-medium text-slate-400">Internal system annotations</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleSaveNotes}
                                disabled={loading}
                                className={cn(
                                    "px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all",
                                    isSaved ? "bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)]" : "bg-slate-900 text-white"
                                )}
                            >
                                {loading ? <RefreshCw className="animate-spin" size={14} /> : isSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                                {isSaved ? "Saved" : "Save Notes"}
                            </button>
                        </div>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Type administrative instructions here..."
                            className="w-full h-44 p-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-600 outline-none focus:bg-white focus:border-[var(--accent-border)] focus:ring-4 focus:ring-[var(--accent-bg)] transition-all resize-none custom-scrollbar"
                        />
                    </div>
                </div>

                {/* Right Column: Routing & Rules */}
                <div className="space-y-8">
                    {/* Routing Protocols */}
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-2.5 bg-[var(--success-bg)] text-[var(--success-text)] rounded-xl">
                                <Map size={20} />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Jurisdictional Routing</h2>
                                <p className="text-[10px] font-medium text-slate-400">District assignment protocols</p>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                            {provinceData.map((province, idx) => (
                                <div key={idx} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 group hover:bg-white hover:border-[var(--accent-border)] transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{province.name}</span>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-[var(--accent-solid)] transition-colors" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {province.districts.map((d, dIdx) => (
                                            <span key={dIdx} className="px-2 py-0.5 bg-white rounded-md text-[9px] font-bold text-slate-400 uppercase border border-slate-100">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Report Thresholds */}
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-2.5 bg-[var(--info-bg)] text-[var(--info-text)] rounded-xl">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Oversight Protocols</h2>
                                <p className="text-[10px] font-medium text-slate-400">Global lifecycle thresholds</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Clock size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Threshold</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">14 Operations Days</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Database size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Retention</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">Endless Audit</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Status Banner */}
            <div className="bg-slate-900 p-8 rounded-[1.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
                    <Database size={180} />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                        <FileText size={32} className="text-[var(--accent-solid)]" />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold tracking-tight">System Identity</h4>
                        <p className="text-xs font-medium text-slate-400 mt-1">Version 1.2.5 Build 8820 &bull; Kernel: RoadPulse-OS</p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-[var(--success-text)] uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--success-text)] animate-pulse" />
                        All Modules Operational
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
