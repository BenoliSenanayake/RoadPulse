import { useState, useMemo } from 'react';
import {
    listPotholes
} from '../lib/api';
import {
    Search,
    Download,
    ArrowUpDown,
    ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as Papa from 'papaparse';
import { cn } from '../lib/utils';
import type { PotholeEvent } from '../types';

const PotholesTable = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [severityFilter, setSeverityFilter] = useState<string>('All');

    const potholes = useMemo(() => listPotholes(), []);

    const filteredPotholes = useMemo<PotholeEvent[]>(() => {
        return potholes.filter(p => {
            const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.roadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.district?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
            const matchesSeverity = severityFilter === 'All' || p.severity === severityFilter;

            return matchesSearch && matchesStatus && matchesSeverity;
        });
    }, [potholes, searchTerm, statusFilter, severityFilter]);

    const handleExport = () => {
        const csvData = filteredPotholes.map(p => ({
            ID: p.id,
            Latitude: p.lat,
            Longitude: p.lon,
            Timestamp: p.timestamp,
            RoadName: p.roadName,
            District: p.district,
            Severity: p.severity,
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text">Pothole Inventory</h1>
                    <p className="text-sm text-gray-500">Manage and track all detected road defects</p>
                </div>
                <button
                    onClick={handleExport}
                    className="btn-primary flex items-center gap-2 w-fit bg-emerald-600 hover:bg-emerald-700"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            <div className="card">
                {/* Filters */}
                <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID, Road or District..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="New">New</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Fixed">Fixed</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <select
                            className="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                        >
                            <option value="All">All Severities</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-border">
                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-gray-500">
                                    <div className="flex items-center gap-1 cursor-pointer">ID <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-gray-500">Location</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-gray-500">Date Detected</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-gray-500">Source</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-gray-500">Confidence</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-gray-500">Status</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPotholes.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-primary">{p.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-text">{p.roadName}</div>
                                        <div className="text-xs text-gray-500">{p.district}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(p.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-sm">
                                            <span className="font-semibold text-gray-800 tracking-tight">Citizen</span>
                                            {p.reportId && (
                                                <span className="text-[10px] font-mono text-gray-500">{p.reportId.split('-')[0]}...</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                        {(p.confidence * 100).toFixed(0)}%
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                p.status === 'New' ? 'bg-blue-600' :
                                                    p.status === 'Confirmed' ? 'bg-amber-500' :
                                                        p.status === 'Scheduled' ? 'bg-purple-500' :
                                                            p.status === 'Fixed' ? 'bg-emerald-600' : 'bg-red-500'
                                            )} />
                                            <span className="text-sm font-medium text-text">{p.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            to={`/potholes/${p.id}`}
                                            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                                        >
                                            Details
                                            <ExternalLink size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filteredPotholes.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-4">
                            <Search size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-text">No potholes found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                    </div>
                )}

                {/* Footer Info */}
                <div className="p-4 bg-gray-50 border-t border-border flex items-center justify-between text-xs text-gray-500">
                    <div>Showing {filteredPotholes.length} of {potholes.length} records</div>
                    <div className="flex items-center gap-2">
                        <button className="px-2 py-1 border border-border rounded bg-white disabled:opacity-50" disabled>Previous</button>
                        <button className="px-2 py-1 border border-border rounded bg-white disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PotholesTable;
