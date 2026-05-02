import { useState, useEffect } from 'react';
import { settingsApi, checkBackendHealth } from '../lib/api';
import { 
    Save, 
    Server, 
    ShieldCheck, 
    Map, 
    FileText, 
    Activity, 
    Info, 
    Globe, 
    AlertCircle,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Terminal
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
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">System Configuration</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Manage global protocols, routing rules, and platform metadata</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Section 1: System Information */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-slate-950 text-cyan-400 rounded-2xl shadow-xl shadow-slate-900/10">
                                <Server size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">System Information</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Core platform environment & status</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Application Name</span>
                                <span className="text-sm font-black text-slate-900">RoadPulse Admin Portal</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Environment</span>
                                <div className="flex items-center gap-2">
                                    <Globe size={12} className="text-blue-500" />
                                    <span className="text-sm font-black text-slate-900">Production (Staging)</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">API Engine Status</span>
                                <div className="flex items-center gap-2">
                                    {isApiOnline === null ? (
                                        <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
                                    ) : isApiOnline ? (
                                        <>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-xs font-black text-emerald-600 uppercase">Operational</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                            <span className="text-xs font-black text-rose-600 uppercase">Offline / Mock Mode</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Build Version</span>
                                <span className="font-mono text-xs font-black text-slate-400">v1.2.4-stable.0502</span>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Report Rules */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Report Protocols</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Validation rules & lifecycle stages</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Overdue Threshold</label>
                                    <span className="text-sm font-black text-blue-600">14 Days</span>
                                </div>
                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                    <div className="h-full bg-blue-600 w-1/2 rounded-full" />
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 mt-2 italic">Reports unaddressed beyond 14 days are flagged for high-priority administrative audit.</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Lifecycle Status Map</label>
                                <div className="flex flex-wrap gap-2">
                                    {['New', 'Verified', 'In Progress', 'Completed', 'Rejected'].map((status) => (
                                        <span key={status} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                            {status}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                                <Info className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-[10px] text-amber-800 font-bold leading-relaxed uppercase tracking-tight">
                                    Status transitions are governed by the audit trail. Any deviation from standard lifecycle stages triggers a security alert.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2 & 4 */}
                <div className="space-y-6">
                    {/* Section 2: Province Routing */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-fit">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <Map size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Geo-Spatial Routing</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Regional jurisdiction mapping</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {provinceData.map((p) => (
                                <div key={p.name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:border-blue-200 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{p.name}</span>
                                        <ChevronRight size={14} className="text-slate-300" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {p.districts.map(d => (
                                            <span key={d} className="text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-0.5 rounded-lg bg-white">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Automatic Dispatch</span>
                                </div>
                                <p className="text-[10px] font-bold text-blue-600/70 leading-relaxed uppercase tracking-tight">
                                    Telemetry is automatically routed based on GPS boundaries. Manual overrides are restricted to Regional Admins.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Admin Notes */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col grow">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
                                <FileText size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Administrative Notes</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Internal coordination & future config</p>
                            </div>
                        </div>

                        <div className="relative flex-1 min-h-[160px]">
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Type administrative notes or future requirements here..."
                                className="w-full h-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-bold text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                            />
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={handleSaveNotes}
                                disabled={loading}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-50"
                            >
                                <Save size={14} />
                                {isSaved ? "Notes Synchronized" : loading ? "Syncing..." : "Update Notes"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Status */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-slate-950/20 border border-white/5 mt-8">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-sm">
                        <Terminal size={32} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Platform Protocols</h4>
                        <p className="text-xs font-bold text-slate-400">Settings are globally synchronized and audited for governance compliance</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
