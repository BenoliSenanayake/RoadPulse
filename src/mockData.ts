import type {
    AuditLog,
    CitizenReport,
    PotholeEvent,
    RepairPriority,
    RepairScheduleInput,
    RepairStatus,
    RepairTeam,
    User
} from './types';

// ==========================================
// ROADPULSE MOCK DATA (DISABLED)
// ==========================================
// All static/mock data has been purged to enforce live PostgreSQL API connectivity.

export const MOCK_USERS: User[] = [];
export const MOCK_REPORTS: CitizenReport[] = [];
export const initialPotholes: PotholeEvent[] = [];

export const getReports = (): CitizenReport[] => {
    console.warn("[MOCK] getReports called but mock data is disabled.");
    return [];
};

export const getPotholes = (): PotholeEvent[] => {
    console.warn("[MOCK] getPotholes called but mock data is disabled.");
    return [];
};

export const getAuditLogs = (): AuditLog[] => {
    return [];
};

export const addAuditLog = (log: any) => {
    console.log("[MOCK] addAuditLog suppressed:", log);
    return null;
};

export const getSystemSettings = () => ({});

export const submitReport = async (report: any) => {
    console.error("[MOCK] submitReport called - should be hitting API instead.");
    throw new Error("Mock submission disabled.");
};

export const processReport = async (id: string, action: string) => {
    console.error("[MOCK] processReport called - should be hitting API instead.");
};

export const updatePotholeStatus = (id: string, status: string) => {
    console.error("[MOCK] updatePotholeStatus called - should be hitting API instead.");
};

export const schedulePotholeRepair = (id: string, input: any) => {
    console.error("[MOCK] schedulePotholeRepair called - should be hitting API instead.");
};
