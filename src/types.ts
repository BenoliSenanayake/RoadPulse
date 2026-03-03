export type PotholeStatus = 'New' | 'Confirmed' | 'Scheduled' | 'Fixed' | 'Rejected';
export type Severity = 'Low' | 'Medium' | 'High';
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
    severity: Severity;
    status: PotholeStatus;
    roadName?: string;
    district?: string;
    imageUrl?: string;
    source?: 'SYSTEM' | 'CITIZEN_REPORT';
    reportId?: string;
    bbox?: [number, number, number, number]; // [x, y, width, height] relative to image (0-1)
    createdAt: string;
    updatedAt: string;
}

export interface RepairUpdate {
    id: string;
    potholeId: string;
    status: PotholeStatus;
    note: string;
    updatedBy: string;
    updatedAt: string;
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
    | 'STATUS_CHANGED';

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
