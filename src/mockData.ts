import type {
    AuditLog,
    CitizenReport,
    PotholeEvent,
    RepairPriority,
    RepairScheduleInput,
    RepairStatus,
    RepairTeam,
    RepairUpdate,
    User
} from './types';
import { subDays } from 'date-fns';

const statuses: PotholeEvent['status'][] = ['New', 'Verified', 'Scheduled', 'In Progress', 'Completed'];
const priorities: RepairPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const teams: RepairTeam[] = ['Team A', 'Team B', 'Team C', 'Emergency Team'];

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
        const confidence = 0.6 + Math.random() * 0.38;
        const timestamp = subDays(new Date(), Math.floor(Math.random() * 30)).toISOString();
        const priority = priorities[i % priorities.length];
        const assignedTeam = ['Scheduled', 'In Progress', 'Completed'].includes(status) ? teams[i % teams.length] : undefined;
        const scheduledDate = assignedTeam ? subDays(new Date(), i % 4 === 0 ? 0 : -((i % 7) + 1)).toISOString() : undefined;
        const repairStatus = status === 'Verified' || status === 'Scheduled' || status === 'In Progress' || status === 'Completed'
            ? status
            : undefined;

        return {
            id: `PH-${1000 + i}`,
            lat,
            lon,
            timestamp,
            confidence,
            status,
            roadName: `${region.name} Main Road ${i + 1}`,
            district: region.name,
            imageUrl: `https://picsum.photos/seed/${i}/1280/720`, // Larger image for zoom
            priority,
            assignedTeam,
            scheduledDate,
            repairStatus,
            maintenanceNotes: assignedTeam ? `Assigned to ${assignedTeam} for surface repair and traffic control.` : '',
            repairStartedAt: status === 'In Progress' || status === 'Completed' ? subDays(new Date(), 1).toISOString() : undefined,
            completedAt: status === 'Completed' ? new Date().toISOString() : undefined,
            createdAt: timestamp,
            updatedAt: timestamp,
        };
    });
};

export const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@roadpulse.lk', role: 'ADMIN' },
    { id: 'u2', name: 'Maintenance Officer', email: 'officer@roadpulse.lk', role: 'MAINTENANCE_OFFICER' },
    { id: 'u3', name: 'Citizen Reporter', email: 'citizen@roadpulse.lk', role: 'CITIZEN' },
];

export const MOCK_REPORTS: CitizenReport[] = [
    {
        id: 'CR-101',
        citizenId: 'u3',
        submittedBy: 'Citizen Reporter',
        lat: 6.9272,
        lon: 79.8613,
        description: 'Large pothole near the junction.',
        imageUrl: 'https://picsum.photos/seed/cr101/800/600',
        aiStatus: 'PENDING',
        status: 'New',
        createdAt: new Date().toISOString()
    }
];

export const getAuditLogs = (): AuditLog[] => {
    const stored = localStorage.getItem('rp_audit_logs');
    if (stored) return JSON.parse(stored);
    return [];
};

export const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const logs = getAuditLogs();
    const newLog: AuditLog = {
        ...log,
        id: `ALG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('rp_audit_logs', JSON.stringify([newLog, ...logs]));
    return newLog;
};

export const getSystemSettings = () => {
    const stored = localStorage.getItem('rp_settings');
    if (stored) return JSON.parse(stored);
    const defaultSettings = { acceptanceThreshold: 0.6 };
    localStorage.setItem('rp_settings', JSON.stringify(defaultSettings));
    return defaultSettings;
};

export const initialPotholes = generatePotholes(50);

const normalizeRepairStatus = (status: PotholeEvent['status']): RepairStatus | undefined => {
    if (status === 'Confirmed' || status === 'Verified') return 'Verified';
    if (status === 'Scheduled') return 'Scheduled';
    if (status === 'In Progress') return 'In Progress';
    if (status === 'Fixed' || status === 'Completed') return 'Completed';
    if (status === 'Rejected' || status === 'Unable to Repair') return 'Unable to Repair';
    return undefined;
};

const repairStatusToPotholeStatus = (status: RepairStatus): PotholeEvent['status'] => {
    if (status === 'Completed') return 'Completed';
    if (status === 'Unable to Repair') return 'Unable to Repair';
    return status;
};

const enrichPothole = (pothole: PotholeEvent, index = 0): PotholeEvent => {
    const repairStatus = pothole.repairStatus || normalizeRepairStatus(pothole.status);
    const priority = pothole.priority || priorities[index % priorities.length];
    return {
        ...pothole,
        status: pothole.status === 'Confirmed' ? 'Verified' : pothole.status === 'Fixed' ? 'Completed' : pothole.status,
        priority,
        repairStatus,
        assignedTeam: pothole.assignedTeam,
        scheduledDate: pothole.scheduledDate,
        maintenanceNotes: pothole.maintenanceNotes || '',
    };
};

export const getReports = (): CitizenReport[] => {
    const stored = localStorage.getItem('rp_reports');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('rp_reports', JSON.stringify(MOCK_REPORTS));
    return MOCK_REPORTS;
};

export const submitReport = async (report: Omit<CitizenReport, 'id' | 'status' | 'createdAt'>): Promise<CitizenReport> => {
    if (!report.citizenId) {
        throw new Error('Reports must be linked to a registered citizen.');
    }

    const reports = getReports();
    const newReport: CitizenReport = {
        ...report,
        id: `CR-${Date.now()}`,
        status: report.aiStatus === 'REJECTED' ? 'Discarded' : 'New',
        createdAt: new Date().toISOString()
    };

    localStorage.setItem('rp_reports', JSON.stringify([newReport, ...reports]));

    addAuditLog({
        entityId: newReport.id,
        entityType: 'REPORT',
        action: 'SUBMITTED',
        actor: 'CITIZEN',
        actorName: newReport.submittedBy || newReport.citizenId,
        details: 'Citizen submitted a new report for validation.'
    });

    if (newReport.aiStatus === 'ACCEPTED') {
        addAuditLog({
            entityId: newReport.id,
            entityType: 'REPORT',
            action: 'AI_ACCEPTED',
            actor: 'SYSTEM',
            actorName: 'Report Intake',
            details: 'Report passed intake review and was converted to a verified pothole.'
        });

        const potholes = getPotholes();
        const newPothole: PotholeEvent = {
            id: `PH-${Date.now()}`,
            lat: newReport.lat,
            lon: newReport.lon,
            timestamp: new Date().toISOString(),
            confidence: newReport.aiConfidence!,
            status: 'Verified',
            imageUrl: newReport.imageUrl,
            source: 'CITIZEN_REPORT',
            reportId: newReport.id,
            bbox: newReport.bbox,
            priority: 'Medium',
            repairStatus: 'Verified',
            maintenanceNotes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('rp_potholes_v2', JSON.stringify([newPothole, ...potholes]));
        newReport.linkedPotholeId = newPothole.id;

        const updatedReports = getReports();
        const index = updatedReports.findIndex(r => r.id === newReport.id);
        if (index !== -1) {
            updatedReports[index] = newReport;
            localStorage.setItem('rp_reports', JSON.stringify(updatedReports));
        }
    } else if (newReport.aiStatus === 'REJECTED') {
        addAuditLog({
            entityId: newReport.id,
            entityType: 'REPORT',
            action: 'AI_REJECTED',
            actor: 'SYSTEM',
            actorName: 'Report Intake',
            details: 'Report was not accepted during intake review.'
        });
    }

    return newReport;
};

export const processReport = (id: string, action: 'accept' | 'reject' | 'request_info', reason?: string, actorName: string = 'Maintenance Officer') => {
    const reports = getReports();
    const index = reports.findIndex(r => r.id === id);
    if (index !== -1) {
        if (action === 'accept') {
            reports[index].aiStatus = 'ACCEPTED';
            reports[index].aiConfidence = reports[index].aiConfidence || (0.85 + Math.random() * 0.1); // Mocked AI confidence if missing
            reports[index].status = 'New';

            addAuditLog({
                entityId: id,
                entityType: 'REPORT',
                action: 'MANUAL_ACCEPTED',
                actor: 'MAINTENANCE_OFFICER',
                actorName,
                details: 'Report manually overridden and accepted by officer.'
            });

            // Retroactively assign bbox and ML metadata if not present
            if (!reports[index].bbox) {
                reports[index].modelName = reports[index].modelName || "YOLOv8";
                reports[index].modelVersion = reports[index].modelVersion || "v0.1";
                reports[index].inferenceTimeMs = reports[index].inferenceTimeMs || Math.round(800 + Math.random() * 2400);
                const w = 0.15 + Math.random() * 0.2;
                const h = 0.15 + Math.random() * 0.2;
                const x = 0.35 + Math.random() * 0.3;
                const y = 0.5 + Math.random() * 0.3;
                reports[index].bbox = [x, y, w, h];
            }

            if (!reports[index].linkedPotholeId) {
                // Validation creates a PotholeEvent
                const potholes = getPotholes();
                const newPothole: PotholeEvent = {
                    id: `PH-${Date.now()}`,
                    lat: reports[index].lat,
                    lon: reports[index].lon,
                    timestamp: new Date().toISOString(),
                    confidence: reports[index].aiConfidence!,
                    status: 'Verified',
                    imageUrl: reports[index].imageUrl,
                    source: 'CITIZEN_REPORT',
                    reportId: reports[index].id,
                    bbox: reports[index].bbox,
                    priority: 'Medium',
                    repairStatus: 'Verified',
                    maintenanceNotes: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                localStorage.setItem('rp_potholes_v2', JSON.stringify([newPothole, ...potholes]));
                reports[index].linkedPotholeId = newPothole.id;
            }
        } else if (action === 'request_info') {
            reports[index].status = 'New';
            reports[index].aiReason = reason ? `Info Requested: ${reason}` : 'Additional information requested by Maintenance Officer.';
            
            addAuditLog({
                entityId: id,
                entityType: 'REPORT',
                action: 'STATUS_CHANGED',
                actor: 'MAINTENANCE_OFFICER',
                actorName,
                details: `Requested more info. Reason: ${reason}`
            });
        } else {
            reports[index].aiStatus = 'REJECTED';
            reports[index].aiReason = reason;
            reports[index].status = 'Discarded';

            addAuditLog({
                entityId: id,
                entityType: 'REPORT',
                action: 'MANUAL_REJECTED',
                actor: 'MAINTENANCE_OFFICER',
                actorName,
                details: `Manually rejected by officer. Reason: ${reason}`
            });
        }
        localStorage.setItem('rp_reports', JSON.stringify(reports));
    }
};

export const getPotholes = (): PotholeEvent[] => {
    const key = 'rp_potholes_v2'; // Bumped version for new schema
    const stored = localStorage.getItem(key);
    if (stored) {
        const enriched = (JSON.parse(stored) as PotholeEvent[]).map(enrichPothole);
        localStorage.setItem(key, JSON.stringify(enriched));
        return enriched;
    }
    localStorage.setItem(key, JSON.stringify(initialPotholes));
    return initialPotholes;
};

export const updatePotholeStatus = (
    id: string,
    status: PotholeEvent['status'],
    note: string,
    user: string,
    updates: Partial<Pick<PotholeEvent, 'priority' | 'assignedTeam' | 'scheduledDate' | 'maintenanceNotes' | 'repairStatus'>> = {}
) => {
    const key = 'rp_potholes_v2';
    const potholes = getPotholes();
    const index = potholes.findIndex(p => p.id === id);
    if (index !== -1) {
        potholes[index].status = status;
        potholes[index].repairStatus = updates.repairStatus || normalizeRepairStatus(status);
        potholes[index].priority = updates.priority || potholes[index].priority;
        potholes[index].assignedTeam = updates.assignedTeam || potholes[index].assignedTeam;
        potholes[index].scheduledDate = updates.scheduledDate || potholes[index].scheduledDate;
        potholes[index].maintenanceNotes = updates.maintenanceNotes ?? potholes[index].maintenanceNotes;
        if (status === 'In Progress' && !potholes[index].repairStartedAt) potholes[index].repairStartedAt = new Date().toISOString();
        if (status === 'Completed' && !potholes[index].completedAt) potholes[index].completedAt = new Date().toISOString();
        potholes[index].updatedAt = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(potholes));

        addAuditLog({
            entityId: id,
            entityType: 'POTHOLE',
            action: 'STATUS_CHANGED',
            actor: 'MAINTENANCE_OFFICER',
            actorName: user,
            details: `Status updated to ${status}. Note: ${note}`
        });

        // Add audit log/repair update
        const repairUpdates = getRepairUpdates(id);
        const newUpdate: RepairUpdate = {
            id: `RU-${Date.now()}`,
            potholeId: id,
            status: potholes[index].repairStatus || normalizeRepairStatus(status) || 'Verified',
            note,
            updatedBy: user,
            updatedAt: new Date().toISOString(),
            assignedTeam: potholes[index].assignedTeam,
            scheduledDate: potholes[index].scheduledDate,
            priority: potholes[index].priority,
        };
        localStorage.setItem(`rp_updates_${id}`, JSON.stringify([...repairUpdates, newUpdate]));
    }
};

export const schedulePotholeRepair = (id: string, input: RepairScheduleInput, user: string) => {
    const nextStatus = repairStatusToPotholeStatus(input.repairStatus);
    updatePotholeStatus(id, nextStatus, input.maintenanceNotes || `Scheduled repair for ${input.assignedTeam}.`, user, {
        priority: input.priority,
        assignedTeam: input.assignedTeam,
        scheduledDate: input.scheduledDate,
        maintenanceNotes: input.maintenanceNotes,
        repairStatus: input.repairStatus,
    });

    addAuditLog({
        entityId: id,
        entityType: 'POTHOLE',
        action: input.repairStatus === 'Scheduled' ? 'REPAIR_SCHEDULED' : 'STATUS_CHANGED',
        actor: 'MAINTENANCE_OFFICER',
        actorName: user,
        details: `${input.assignedTeam} assigned. Priority: ${input.priority}. Scheduled date: ${new Date(input.scheduledDate).toLocaleDateString()}.`
    });

    return getPotholes().find(p => p.id === id) || null;
};

export const getRepairUpdates = (potholeId: string): RepairUpdate[] => {
    const stored = localStorage.getItem(`rp_updates_${potholeId}`);
    return stored ? JSON.parse(stored) : [];
};
