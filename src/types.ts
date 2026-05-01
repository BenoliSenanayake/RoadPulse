export type RepairPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type RepairTeam = 'Team A' | 'Team B' | 'Team C' | 'Emergency Team';
export type RepairStatus = 'Verified' | 'Scheduled' | 'In Progress' | 'Completed' | 'Unable to Repair';
export type PotholeStatus =
    | 'New'
    | 'Confirmed'
    | 'Verified'
    | 'Scheduled'
    | 'In Progress'
    | 'Fixed'
    | 'Completed'
    | 'Rejected'
    | 'Unable to Repair';
export type UserRole = 'MAINTENANCE_OFFICER' | 'CITIZEN' | 'ADMIN';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    email: string;
}

export interface PotholeEvent {
    id: string;
    lat: number;
    lon: number;
    timestamp: string;
    confidence: number;
    status: PotholeStatus;
    roadName?: string;
    district?: string;
    imageUrl?: string;
    source?: 'SYSTEM' | 'CITIZEN_REPORT';
    reportId?: string;
    bbox?: [number, number, number, number]; // [x, y, width, height] relative to image (0-1)
    priority?: RepairPriority;
    assignedTeam?: RepairTeam;
    scheduledDate?: string;
    maintenanceNotes?: string;
    repairStatus?: RepairStatus;
    repairStartedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface RepairUpdate {
    id: string;
    potholeId: string;
    status: RepairStatus;
    note: string;
    updatedBy: string;
    updatedAt: string;
    assignedTeam?: RepairTeam;
    scheduledDate?: string;
    priority?: RepairPriority;
}

export interface RepairScheduleInput {
    priority: RepairPriority;
    assignedTeam: RepairTeam;
    scheduledDate: string;
    maintenanceNotes: string;
    repairStatus: RepairStatus;
}

export interface CitizenReport {
    id: string;
    citizenId: string;
    submittedBy?: string; // Optional for mock
    lat: number;
    lon: number;
    description?: string;
    imageUrl: string;
    aiStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    aiConfidence?: number;
    aiReason?: string;
    modelName?: string;
    modelVersion?: string;
    inferenceTimeMs?: number;
    bbox?: [number, number, number, number];
    linkedPotholeId?: string;
    status: 'New' | 'Discarded'; // Mapping from assignment
    createdAt: string; // Keep as submittedAt alias
}

export type AuditLogAction =
    | 'SUBMITTED'
    | 'AI_PENDING'
    | 'AI_ACCEPTED'
    | 'AI_REJECTED'
    | 'MANUAL_ACCEPTED'
    | 'MANUAL_REJECTED'
    | 'STATUS_CHANGED'
    | 'REPAIR_SCHEDULED'
    | 'REPAIR_STARTED'
    | 'REPAIR_COMPLETED'
    | 'REPAIR_NOTE_ADDED';

export interface AuditLog {
    id: string;
    timestamp: string;
    entityId: string; // Pothole ID or CitizenReport ID
    entityType: 'POTHOLE' | 'REPORT';
    action: AuditLogAction;
    actor: 'CITIZEN' | 'SYSTEM' | 'MAINTENANCE_OFFICER' | 'ADMIN';
    actorName?: string;
    details?: string; // JSON string or human-readable details
}
