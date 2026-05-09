export type RepairPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type RepairTeam = 'Team A' | 'Team B' | 'Team C' | 'Emergency Team' | 'Unassigned';
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

export type ProvincialCouncil =
    | 'Western Provincial Council'
    | 'Central Provincial Council'
    | 'Southern Provincial Council'
    | 'Northern Provincial Council'
    | 'Eastern Provincial Council'
    | 'North Western Provincial Council'
    | 'North Central Provincial Council'
    | 'Uva Provincial Council'
    | 'Sabaragamuwa Provincial Council'
    | 'Unassigned';

export const PROVINCIAL_COUNCILS: ProvincialCouncil[] = [
    'Western Provincial Council',
    'Central Provincial Council',
    'Southern Provincial Council',
    'Northern Provincial Council',
    'Eastern Provincial Council',
    'North Western Provincial Council',
    'North Central Provincial Council',
    'Uva Provincial Council',
    'Sabaragamuwa Provincial Council',
];

export interface User {
    id: string;
    name: string;
    role: UserRole;
    email: string;
    provincialCouncil?: ProvincialCouncil; // For MAINTENANCE_OFFICER
    status: 'ACTIVE' | 'DISABLED';
    createdAt: string;
    lastLogin?: string;
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
    bbox?: any;
    priority?: RepairPriority;
    assignedTeam?: RepairTeam;
    scheduledDate?: string;
    maintenanceNotes?: string;
    repairStatus?: RepairStatus;
    repairStartedAt?: string;
    completedAt?: string;
    provincialCouncil?: ProvincialCouncil;
    lastStatusUpdatedBy?: string;
    lastStatusUpdatedAt?: string;
    aiClassification?: 'VERIFIED_POTHOLE' | 'NEEDS_MANUAL_REVIEW' | 'REJECTED' | string;
    aiConfidence?: number;
    predictionCount?: number;
    submittedAt?: string;
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
    aiClassification?: 'VERIFIED_POTHOLE' | 'NEEDS_MANUAL_REVIEW' | 'REJECTED' | string;
    predictionCount?: number;
    detectionModel?: string;
    detectionTimestamp?: string;
    detectionStatus?: string;
    modelName?: string;
    modelVersion?: string;
    inferenceTimeMs?: number;
    bbox?: any;
    linkedPotholeId?: string;
    provincialCouncil?: ProvincialCouncil;
    provinceDetectionMethod?: 'GPS_BOUNDARY' | 'MANUAL' | 'UNKNOWN';
    district?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    maintenanceNotes?: string;
    lastStatusUpdatedAt?: string;
    submittedAt?: string;
    updatedAt?: string;
    status: 'New' | 'Verified' | 'In Progress' | 'Completed' | 'Rejected' | 'Discarded'; // Mapping from assignment
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
    details?: string;
    province?: ProvincialCouncil;
    oldStatus?: string;
    newStatus?: string;
}
