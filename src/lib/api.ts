import type { 
    CitizenReport, 
    PotholeEvent, 
    PotholeStatus, 
    RepairScheduleInput,
    AuditLog
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const PORTAL_MODE = import.meta.env.VITE_PORTAL_MODE || 'citizen';

// CRITICAL: DISABLE MOCK DATA COMPLETELY WHEN BACKEND IS INTENDED
export const USE_MOCK = false; 

export let isBackendDown = false;

export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${API_BASE_URL}/debug/db`, { signal: controller.signal });
        clearTimeout(timeout);
        isBackendDown = !response.ok;
        return response.ok;
    } catch {
        isBackendDown = true;
        return false;
    }
};

// ==========================================
// REPORT NORMALIZER (CORE UTILITY)
// ==========================================
export const normalizeReport = (data: any): CitizenReport => {
    if (!data) return data;
    
    // Map backend snake_case to frontend camelCase
    const id = String(data.id || '');
    const citizenId = String(data.citizen_id || data.citizenId || 'Anonymous');

    // AI Status Mapping
    let aiStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' = 'PENDING';
    const classification = data.ai_classification || data.aiClassification;
    
    if (classification === 'VERIFIED_POTHOLE' || classification === 'ACCEPTED') aiStatus = 'ACCEPTED';
    else if (classification === 'REJECTED' || classification === 'NON_POTHOLE') aiStatus = 'REJECTED';
    else if (data.status === 'Verified') aiStatus = 'ACCEPTED';
    else if (data.status === 'Rejected') aiStatus = 'REJECTED';

    const mapped: CitizenReport = {
        ...data,
        id: id,
        citizenId: citizenId,
        submittedBy: citizenId, 
        lat: Number(data.latitude || data.lat || 0),
        lon: Number(data.longitude || data.lon || 0),
        imageUrl: data.image_url || data.imageUrl,
        aiClassification: classification || 'NEEDS_MANUAL_REVIEW',
        aiStatus: aiStatus,
        aiConfidence: Number(data.ai_confidence || data.aiConfidence || 0),
        aiReason: data.notes || data.maintenance_notes || data.aiReason || '',
        predictionCount: Number(data.prediction_count || data.predictionCount || 0),
        detectionModel: data.detection_model || data.detectionModel || 'Roboflow YOLOv8',
        detectionTimestamp: data.detection_timestamp || data.detectionTimestamp || data.submitted_at || data.createdAt,
        createdAt: data.submitted_at || data.createdAt || new Date().toISOString(),
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
        lastStatusUpdatedAt: data.last_status_updated_at || data.lastStatusUpdatedAt,
        provincialCouncil: data.provincial_council || data.provincialCouncil || 'Unassigned',
        district: data.district || 'General',
        status: (data.status as any) || 'New',
        maintenanceNotes: data.maintenance_notes || data.maintenanceNotes || '',
        priority: data.priority || 'Medium',
        bbox: data.bbox || null
    };

    if (import.meta.env.DEV || true) {
        console.log(`[API Normalizer] Record ${mapped.id}:`, {
            id: mapped.id,
            citizenId: mapped.citizenId,
            status: mapped.status,
            pc: mapped.provincialCouncil,
            district: mapped.district
        });
    }

    return mapped;
};

const mapBackendReportToFrontend = normalizeReport;

const mapReportToPotholeEvent = (data: any): PotholeEvent => {
    if (!data) return data;
    const cr = mapBackendReportToFrontend(data) as any;
    return {
        ...cr,
        timestamp: cr.createdAt,
        updatedAt: cr.updatedAt ?? cr.createdAt,
        confidence: cr.aiConfidence ?? 0,
        status: cr.status as PotholeStatus,
        repairStatus: cr.status as any,
        aiClassification: cr.aiClassification || 'NEEDS_MANUAL_REVIEW',
        aiConfidence: cr.aiConfidence ?? 0,
        predictionCount: cr.predictionCount ?? 0,
        priority: cr.priority || 'Medium',
        district: cr.district || 'Unknown District',
        provincialCouncil: cr.provincialCouncil || 'Unassigned',
        maintenanceNotes: cr.maintenanceNotes || '',
    };
};

// ==========================================
// BASE API CLIENT
// ==========================================
const apiClient = {
    async get(endpoint: string) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            isBackendDown = false;
            return response.json();
        } catch (e) {
            isBackendDown = true;
            throw e;
        }
    },
    async post(endpoint: string, data: any) {
        const isFormData = data instanceof FormData;
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`[apiClient.post] URL: ${url}`);
        if (isFormData) {
            const fields: string[] = [];
            (data as FormData).forEach((_v, k) => fields.push(k));
            console.log(`[apiClient.post] FormData fields: ${fields.join(', ')}`);
        }

        const options: RequestInit = {
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data),
        };
        if (!isFormData) {
            options.headers = { 'Content-Type': 'application/json' };
        }
        
        const response = await fetch(url, options);
        if (!response.ok) {
            // Try to extract the real error detail from the backend JSON response
            let detail = response.statusText;
            try {
                const errBody = await response.json();
                detail = errBody.detail || JSON.stringify(errBody);
            } catch { /* response wasn't JSON */ }
            console.error(`[apiClient.post] ${response.status} error: ${detail}`);
            throw new Error(detail);
        }
        console.log(`[apiClient.post] Success: ${response.status}`);
        return response.json();
    },
    async patch(endpoint: string, data: any) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    }
};

// Helper for fallback
async function withFallback<T>(apiCall: () => Promise<T>, mockFallback: () => Promise<T> | T): Promise<T> {
    const isStaffOrAdmin = ['staff', 'admin'].includes(PORTAL_MODE);
    
    try {
        const result = await apiCall();
        return result;
    } catch (e) {
        console.error(`[API Error] ${PORTAL_MODE} portal failed to fetch from backend:`, e);
        
        // FORCED: Staff and Admin portals MUST NOT fall back to mock data.
        if (isStaffOrAdmin || !USE_MOCK) {
            console.warn(`[API Security] Suppressing mock fallback. Portal Mode: ${PORTAL_MODE}, USE_MOCK: ${USE_MOCK}`);
            throw new Error(`Database unavailable. This portal requires a live connection to PostgreSQL.`);
        }
        
        console.log("Backend unavailable - demo mode active");
        return mockFallback();
    }
}

// ==========================================
// DOMAIN APIs
// ==========================================

export const reportsApi = {
    list: async (filters?: { status?: string; citizenId?: string; provincialCouncil?: string }): Promise<CitizenReport[]> => {
        return withFallback(
            async () => {
                const params: any = {};
                if (filters?.status) params.status = filters.status;
                if (filters?.citizenId) params.citizenId = filters.citizenId;
                if (filters?.provincialCouncil) params.provincialCouncil = filters.provincialCouncil;
                
                const query = new URLSearchParams(params).toString();
                console.log(`[API] GET /reports?${query} called`);
                const res = await apiClient.get(`/reports?${query}`);
                console.log(`[API] GET /reports returned ${res.length} items`);
                return Array.isArray(res) ? res.map(mapBackendReportToFrontend) : [];
            },
            async () => [] // Returns empty if no mock allowed
        );
    },
    getById: async (id: string): Promise<CitizenReport | null> => {
        return withFallback(
            async () => {
                const res = await apiClient.get(`/reports/${id}`);
                return mapBackendReportToFrontend(res);
            },
            async () => null
        );
    },
    submit: async (data: any): Promise<CitizenReport> => {
        console.log('[reportsApi.submit] Called');
        console.log(`[reportsApi.submit] API_BASE_URL: ${API_BASE_URL}`);
        console.log(`[reportsApi.submit] Endpoint: ${API_BASE_URL}/reports`);
        
        // Log FormData contents if applicable
        if (data instanceof FormData) {
            const entries: string[] = [];
            (data as FormData).forEach((val, key) => {
                if (val instanceof File) {
                    entries.push(`${key}: [File: ${val.name}, ${val.size} bytes]`);
                } else {
                    entries.push(`${key}: ${val}`);
                }
            });
            console.log(`[reportsApi.submit] FormData: ${entries.join(', ')}`);
        }
        
        try {
            const res = await apiClient.post('/reports', data);
            console.log('[reportsApi.submit] Backend response:', res);
            return mapBackendReportToFrontend(res);
        } catch (err: any) {
            console.error('[reportsApi.submit] POST /reports failed:', err.message);
            throw err; // Surface the REAL error — never mask it
        }
    },
    review: async (id: string, action: 'accept' | 'reject' | 'request_info', reason?: string): Promise<void> => {
        return withFallback(
            async () => {
                let status = 'New';
                if (action === 'accept') status = 'Verified';
                else if (action === 'reject') status = 'Rejected';
                await apiClient.patch(`/reports/${id}/status`, { status, notes: reason });
            },
            async () => {}
        );
    },
    update: async (id: string, updates: Partial<CitizenReport>): Promise<CitizenReport | null> => {
        return withFallback(
            async () => {
                // Map frontend field names to backend StatusUpdateCreate schema
                const payload: any = {};
                if (updates.status) payload.status = updates.status;
                if (updates.priority) payload.priority = updates.priority;
                if (updates.maintenanceNotes !== undefined) payload.notes = updates.maintenanceNotes;
                if (updates.provincialCouncil) payload.provincial_council = updates.provincialCouncil;
                
                const res = await apiClient.patch(`/reports/${id}/status`, payload);
                return mapBackendReportToFrontend(res);
            },
            async () => null
        );
    }
};

export const potholesApi = {
    list: async (filters?: { status?: string; provincialCouncil?: string }): Promise<PotholeEvent[]> => {
        return withFallback(
            async () => {
                const params: any = {};
                if (filters?.status) params.status = filters.status;
                if (filters?.provincialCouncil) params.provincialCouncil = filters.provincialCouncil;
                const query = new URLSearchParams(params).toString();
                const res = await apiClient.get(`/reports?${query}`);
                return Array.isArray(res) ? res.map(mapReportToPotholeEvent) : [];
            },
            async () => []
        );
    },
    getById: async (id: string): Promise<PotholeEvent | null> => {
        return withFallback(
            async () => {
                const res = await apiClient.get(`/reports/${id}`);
                return mapReportToPotholeEvent(res);
            },
            async () => null
        );
    },
    updateStatus: async (id: string, status: PotholeStatus, note: string, updatedBy?: string): Promise<void> => {
        return withFallback(
            async () => {
                await apiClient.patch(`/reports/${id}/status`, { status, notes: note });
            },
            async () => {}
        );
    },
    scheduleRepair: async (id: string, data: RepairScheduleInput, updatedBy?: string): Promise<PotholeEvent | null> => {
        return withFallback(
            async () => {
                const payload = {
                    status: data.repairStatus,
                    priority: data.priority,
                    notes: `Scheduled for ${data.scheduledDate} with ${data.assignedTeam}. ${data.maintenanceNotes}`
                };
                const res = await apiClient.patch(`/reports/${id}/status`, payload);
                return mapReportToPotholeEvent(res);
            },
            async () => null
        );
    }
};

export const authApi = {
    login: async (email: string, password?: string, provincialCouncil?: string): Promise<any | null> => {
        try {
            return await apiClient.post('/auth/login', { 
                email, 
                password, 
                provincial_council: provincialCouncil 
            });
        } catch (e: any) {
            console.error(`[authApi.login] Error: ${e.message}`);
            throw e;
        }
    },
    verifyStaff: async (email: string): Promise<any | null> => {
        try {
            return await apiClient.get(`/auth/staff/verify?email=${email}`);
        } catch {
            return null;
        }
    },
    checkEmailExists: async (email: string): Promise<boolean> => {
        try {
            const res = await apiClient.get(`/auth/check-email?email=${email}`);
            return res.exists;
        } catch {
            return false;
        }
    },
    signup: async (data: any): Promise<{ success: boolean; userId?: string; error?: string }> => {
        try {
            const user = await apiClient.post('/auth/signup', data);
            return { success: true, userId: user?.id };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },
    listUsers: async (): Promise<any[]> => {
        try {
            return await apiClient.get('/auth/users');
        } catch {
            return [];
        }
    }
};

export const normalizeAuditLog = (data: any): AuditLog => ({
    id: String(data.id),
    timestamp: data.created_at || new Date().toISOString(),
    entityId: data.report_id || 'System',
    entityType: data.report_id ? 'REPORT' : 'POTHOLE',
    action: data.action as any,
    actor: data.user_id === 'sys-admin' ? 'ADMIN' : 'MAINTENANCE_OFFICER',
    actorName: data.user_id,
    details: data.notes,
    oldStatus: data.old_status,
    newStatus: data.new_status
});

export const auditLogsApi = {
    list: async (): Promise<AuditLog[]> => {
        return withFallback(
            async () => {
                const res = await apiClient.get('/reports/history');
                return Array.isArray(res) ? res.map(normalizeAuditLog) : [];
            },
            async () => []
        );
    }
};

export const settingsApi = {
    get: async () => {
        return withFallback(
            () => apiClient.get('/settings'),
            async () => ({})
        );
    },
    update: async (settings: any) => {
        return withFallback(
            () => apiClient.patch('/settings', settings),
            async () => ({})
        );
    }
};

// ==========================================
// LEGACY COMPATIBILITY EXPORTS (STUBS)
// ==========================================
export const listCitizenReports = () => [];
export const submitCitizenReport = () => { throw new Error("Use reportsApi.submit"); };
export const reviewCitizenReport = () => {};
export const listPotholes = () => [];
export const getPotholeById = () => null;
export const updatePotholeStatus = () => {};
export const schedulePotholeRepair = () => {};
