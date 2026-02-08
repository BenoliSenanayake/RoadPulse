export type PotholeStatus = 'New' | 'Confirmed' | 'Scheduled' | 'Fixed' | 'Rejected';
export type Severity = 'Low' | 'Medium' | 'High';
export type UserRole = 'MAINTENANCE_OFFICER' | 'VEHICLE_OPERATOR' | 'ADMIN';
export type IssueType = 'GPS_MISSING' | 'UPLOAD_STALLED' | 'CAMERA_DISCONNECTED' | 'LOW_STORAGE';

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
    frameId?: string;
    runId: string;
    bbox?: {
        x: number;
        y: number;
        w: number;
        h: number;
        format?: 'REL' | 'ABS';
    };
    modelName?: string;
    modelVersion?: string;
    inferenceTimeMs?: number;
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

export interface InspectionIssue {
    id: string;
    type: IssueType;
    message: string;
    timestamp: string;
    resolved: boolean;
    resolvedAt?: string;
    resolvedBy?: string;
}

export interface InspectionRun {
    id: string;
    vehicleId: string;
    operatorName: string;
    startTime: string;
    endTime?: string;
    uploadProgress: number; // 0-100
    issues: InspectionIssue[];
    status: 'active' | 'ended' | 'failed';
}
