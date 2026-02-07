import type { PotholeEvent, User, InspectionRun, RepairUpdate } from './types';
import { subDays } from 'date-fns';

const statuses: PotholeEvent['status'][] = ['New', 'Confirmed', 'Scheduled', 'Fixed', 'Rejected'];
const severities: PotholeEvent['severity'][] = ['Low', 'Medium', 'High'];

const SRI_LANKA_REGIONS = [
    { name: 'Colombo', lat: 6.9271, lon: 79.8612 },
    { name: 'Kandy', lat: 7.2906, lon: 80.6337 },
    { name: 'Gampaha', lat: 7.0873, lon: 79.9925 },
];

const generatePotholes = (count: number): PotholeEvent[] => {
    return Array.from({ length: count }).map((_, i) => {
        const region = SRI_LANKA_REGIONS[Math.floor(Math.random() * SRI_LANKA_REGIONS.length)];
        const lat = region.lat + (Math.random() - 0.5) * 0.1;
        const lon = region.lon + (Math.random() - 0.5) * 0.1;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const confidence = 0.6 + Math.random() * 0.38;
        const timestamp = subDays(new Date(), Math.floor(Math.random() * 30)).toISOString();

        return {
            id: `PH-${1000 + i}`,
            lat,
            lon,
            timestamp,
            confidence,
            severity,
            status,
            roadName: `${region.name} Main Road ${i + 1}`,
            district: region.name,
            imageUrl: `https://picsum.photos/seed/${i}/800/600`, // Placeholder image
            runId: `RUN-${Math.floor(i / 5) + 1}`,
            createdAt: timestamp,
            updatedAt: timestamp,
        };
    });
};

export const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@roadpulse.lk', role: 'ADMIN' },
    { id: 'u2', name: 'Maintenance Officer', email: 'officer@roadpulse.lk', role: 'MAINTENANCE_OFFICER' },
    { id: 'u3', name: 'Vehicle Operator', email: 'operator@roadpulse.lk', role: 'VEHICLE_OPERATOR' },
];

export const MOCK_RUNS: InspectionRun[] = [
    {
        id: 'RUN-1',
        vehicleId: 'WP-1234',
        operatorName: 'John Doe',
        startTime: subDays(new Date(), 1).toISOString(),
        uploadProgress: 100,
        issues: [],
        status: 'ended',
    },
    {
        id: 'RUN-2',
        vehicleId: 'WP-5678',
        operatorName: 'Jane Smith',
        startTime: new Date().toISOString(),
        uploadProgress: 45,
        issues: [
            {
                id: 'ISS-1',
                type: 'GPS_MISSING',
                message: 'Intermittent GPS signal loss in Gampaha region',
                timestamp: new Date().toISOString(),
                resolved: false
            },
            {
                id: 'ISS-2',
                type: 'CAMERA_DISCONNECTED',
                message: 'Rear-aux camera detached from stream',
                timestamp: new Date().toISOString(),
                resolved: false
            }
        ],
        status: 'active',
    },
];

export const initialPotholes = generatePotholes(50);

// Simple storage simulation
export const getRuns = (): InspectionRun[] => {
    const stored = localStorage.getItem('rp_runs');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('rp_runs', JSON.stringify(MOCK_RUNS));
    return MOCK_RUNS;
};

export const resolveIssue = (runId: string, issueId: string, user: string) => {
    const runs = getRuns();
    const runIndex = runs.findIndex(r => r.id === runId);
    if (runIndex !== -1) {
        const issueIndex = runs[runIndex].issues.findIndex(i => i.id === issueId);
        if (issueIndex !== -1) {
            runs[runIndex].issues[issueIndex].resolved = true;
            runs[runIndex].issues[issueIndex].resolvedAt = new Date().toISOString();
            runs[runIndex].issues[issueIndex].resolvedBy = user;
            localStorage.setItem('rp_runs', JSON.stringify(runs));
        }
    }
};

export const getPotholes = (): PotholeEvent[] => {
    const stored = localStorage.getItem('rp_potholes');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('rp_potholes', JSON.stringify(initialPotholes));
    return initialPotholes;
};

export const updatePotholeStatus = (id: string, status: PotholeEvent['status'], note: string, user: string) => {
    const potholes = getPotholes();
    const index = potholes.findIndex(p => p.id === id);
    if (index !== -1) {
        potholes[index].status = status;
        potholes[index].updatedAt = new Date().toISOString();
        localStorage.setItem('rp_potholes', JSON.stringify(potholes));

        // Add audit log/repair update
        const updates = getRepairUpdates(id);
        const newUpdate: RepairUpdate = {
            id: `RU-${Date.now()}`,
            potholeId: id,
            status,
            note,
            updatedBy: user,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(`rp_updates_${id}`, JSON.stringify([...updates, newUpdate]));
    }
};

export const getRepairUpdates = (potholeId: string): RepairUpdate[] => {
    const stored = localStorage.getItem(`rp_updates_${potholeId}`);
    return stored ? JSON.parse(stored) : [];
};
