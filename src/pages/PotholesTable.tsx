import { potholesApi } from '../lib/api';
import {
    Search,
    Download,
    MapPin,
    Calendar,
    ChevronRight,
    Filter,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as Papa from 'papaparse';

import { useState, useMemo, useEffect } from 'react';
import type { PotholeEvent } from '../types';
import { ResponsiveDataList } from '../components/ResponsiveDataList';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { getProvinceShortName, normalizeProvince } from '../lib/provinceResolver';

const PotholesTable = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setError('');
            if (!province || province === 'Unassigned') {
                setError('Officer province is missing. Please sign in again.');
                setLoading(false);
                return;
            }
            const staffProvince = normalizeProvince(province);
            console.log(`[PotholesTable Debug] Current User:`, user?.email, staffProvince);
            
            // Fetch all and filter on frontend for maximum reliability
            const data = await potholesApi.list();
            console.log(`[PotholesTable] Raw telemetry: ${data.length} records.`);
            
            const filtered = data.filter(p => normalizeProvince(p.provincialCouncil) === staffProvince);
            console.log(`[PotholesTable] Filtered for ${staffProvince}: ${filtered.length} records.`);
            
            setPotholes(filtered);
        } catch (err) {
            console.error("[PotholesTable] Sync failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [province]);

    const filteredPotholes = useMemo<PotholeEvent[]>(() => {
        return potholes.filter((p: PotholeEvent) => {
            const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.roadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.district?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [potholes, searchTerm, statusFilter]);

    const handleExport = () => {
        const csvData = filteredPotholes.map((p: PotholeEvent) => ({
            ID: p.id,
            Latitude: p.lat,
            Longitude: p.lon,
            Timestamp: p.timestamp,
            RoadName: p.roadName,
            District: p.district,
            Status: p.status,
            Source: p.source || 'CITIZEN_REPORT',
            ReportID: p.reportId || 'N/A',
            Confidence: (p.confidence * 100).toFixed(1) + '%'
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `roadpulse_potholes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = [
        {
            header: 'ID',
            render: (p: PotholeEvent) => (
                <span className="text-xs font-black text-slate-900 group-hover:text-accent transition-colors">#{p.id.split('-')[0]}</span>
            )
        },
        {
            header: 'Location',
            render: (p: PotholeEvent) => (
                <div>
                    <div className="text-xs font-bold text-slate-900">{p.roadName}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{p.district}</div>
                </div>
            )
        },
        {
            header: 'Date Detected',
            render: (p: PotholeEvent) => (
                <span className="text-xs font-bold text-slate-500">
                    {new Date(p.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            )
        },
        {
            header: 'Analytics',
            render: (p: PotholeEvent) => (
                <div className="flex items-center gap-2">
                    <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-900 h-full transition-all duration-1000" style={{ width: `${p.confidence * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-black font-mono text-slate-500">{(p.confidence * 100).toFixed(0)}%</span>
                </div>
            )
        },
        {
            header: 'Status',
            render: (p: PotholeEvent) => <StatusPill status={p.status as any} />
        },
        {
            header: 'Actions',
            className: 'text-right',
            render: () => (
                <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
                    Inspect
                    <ChevronRight size={14} />
                </div>
            )
        }
    ];

    const renderCard = (p: PotholeEvent) => (
        <div className="p-5 space-y-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-sm font-black text-slate-900 mb-1">#{p.id.split('-')[0]}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin size={12} />
                        <span className="text-xs font-bold leading-none">{p.roadName}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                        <Calendar size={12} />
                        {new Date(p.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                </div>
                <StatusPill status={p.status as any} />
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading inventory records</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-3xl border border-rose-100 bg-white p-10 text-center shadow-sm max-w-md mx-auto mt-10">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} className="text-rose-500" />
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Operations Restricted</h2>
                <p className="text-sm text-slate-500 font-bold mb-6">{error}</p>
                <button onClick={() => navigate('/staff/login')} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Sign In Again</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="section-heading">Pothole Inventory</h1>
                        {province && province !== 'Unassigned' && (
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                                <MapPin size={12} /> {getProvinceShortName(province)}
                            </div>
                        )}
                    </div>
                    <p className="text-slate-500 font-bold text-sm">Comprehensive archive of detected road surface anomalies within your jurisdiction.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="btn-premium bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800"
                >
                    <Download size={18} />
                    Export Dataset
                </button>
            </div>

            <div className="card-premium overflow-hidden border-none shadow-premium">
                {/* Filters */}
                <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-6 bg-slate-50/50">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Identify by ID, Road or District..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative">
                            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                className="pl-10 pr-8 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-700 shadow-sm outline-none focus:border-slate-400 transition-all appearance-none cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Operational Statuses</option>
                                <option value="New">New</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Verified">Verified</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                <ResponsiveDataList
                    data={filteredPotholes}
                    columns={columns}
                    renderCard={renderCard}
                    keyExtractor={(p) => p.id}
                    onRowClick={(p) => navigate(`/potholes/${p.id}`)}
                    className="animate-fade-in-up"
                />

                {/* Footer Info */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        Showing {filteredPotholes.length} of {potholes.length} System Records
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-50 shadow-premium transition-all" disabled>Prev</button>
                        <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-premium transition-all hover-lift active:scale-95">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PotholesTable;
