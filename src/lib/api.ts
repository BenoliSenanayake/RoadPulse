import type { 
    CitizenReport, 
    PotholeEvent, 
    PotholeStatus, 
    RepairScheduleInput,
    AuditLog,
    PaginatedResponse
} from '../types';
import { canonicalizeStatus } from './status';

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
    const reportStatus = canonicalizeStatus(data.status);
    
    if (classification === 'VERIFIED_POTHOLE' || classification === 'ACCEPTED') aiStatus = 'ACCEPTED';
    else if (classification === 'REJECTED' || classification === 'NON_POTHOLE') aiStatus = 'REJECTED';
    else if (reportStatus === 'Verified') aiStatus = 'ACCEPTED';
    else if (reportStatus === 'Rejected') aiStatus = 'REJECTED';

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
        status: reportStatus,
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
    getHeaders() {
        const headers: Record<string, string> = {};
        const token = localStorage.getItem('roadpulse_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },
    async get(endpoint: string) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: this.getHeaders()
            });
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
        
        const headers: Record<string, string> = this.getHeaders();
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const options: RequestInit = {
            method: 'POST',
            headers: headers,
            body: isFormData ? data : JSON.stringify(data),
        };
        
        const response = await fetch(url, options);
        if (!response.ok) {
            let detail = response.statusText;
            try {
                const errBody = await response.json();
                detail = errBody.detail || JSON.stringify(errBody);
            } catch { /* response wasn't JSON */ }
            throw new Error(detail);
        }
        return response.json();
    },
    async patch(endpoint: string, data: any) {
        const headers: Record<string, string> = this.getHeaders();
        headers['Content-Type'] = 'application/json';
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            let detail = response.statusText;
            try {
                const errBody = await response.json();
                detail = errBody.detail || JSON.stringify(errBody);
            } catch { /* response wasn't JSON */ }
            throw new Error(detail);
        }
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
    list: async (filters?: { 
        page?: number; 
        limit?: number; 
        status?: string; 
        category?: string;
        citizenId?: string; 
        provincialCouncil?: string;
        district?: string;
        priority?: string;
        search?: string;
    }): Promise<PaginatedResponse<CitizenReport>> => {
        return withFallback(
            async () => {
                const params: any = {
                    page: filters?.page || 1,
                    limit: filters?.limit || 10,
                };
                if (filters?.status) params.status = filters.status;
                if (filters?.category) params.category = filters.category;
                if (filters?.citizenId) params.citizenId = filters.citizenId;
                if (filters?.provincialCouncil) params.provincialCouncil = filters.provincialCouncil;
                if (filters?.district) params.district = filters.district;
                if (filters?.priority) params.priority = filters.priority;
                if (filters?.search) params.search = filters.search;
                
                const query = new URLSearchParams(params).toString();
                console.log(`[API] GET /reports?${query} called`);
                const res = await apiClient.get(`/reports?${query}`);
                
                return {
                    ...res,
                    data: Array.isArray(res.data) ? res.data.map(mapBackendReportToFrontend) : []
                };
            },
            async () => ({ data: [], total: 0, page: 1, limit: 10, total_pages: 0 })
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
    getHistory: async (id: string): Promise<AuditLog[]> => {
        return withFallback(
            async () => {
                const res = await apiClient.get(`/reports/${id}/history`);
                return Array.isArray(res) ? res.map(normalizeAuditLog) : [];
            },
            async () => []
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
    updateStatus: async (
        id: string,
        status: CitizenReport['status'],
        notes?: string,
        priority?: CitizenReport['priority']
    ): Promise<CitizenReport | null> => {
        return withFallback(
            async () => {
                const payload: { status: string; notes?: string; priority?: string } = {
                    status: canonicalizeStatus(status),
                };
                if (notes) payload.notes = notes;
                if (priority) payload.priority = priority;
                const res = await apiClient.patch(`/reports/${id}/status`, payload);
                return mapBackendReportToFrontend(res);
            },
            async () => null
        );
    },
    update: async (id: string, updates: Partial<CitizenReport>): Promise<CitizenReport | null> => {
        return withFallback(
            async () => {
                console.log(`[API] Updating report ${id}:`, updates);
                // Use the base patch endpoint for multi-field updates (province, district, status, notes)
                const res = await apiClient.patch(`/reports/${id}`, updates);
                return mapBackendReportToFrontend(res);
            },
            async () => null
        );
    },
    getProvinceStats: async (): Promise<{ province: string; count: number }[]> => {
        return withFallback(
            async () => await apiClient.get('/reports/stats/provinces'),
            async () => []
        );
    }
};

export const potholesApi = {
    list: async (filters?: { 
        page?: number; 
        limit?: number; 
        status?: string; 
        provincialCouncil?: string 
    }): Promise<PaginatedResponse<PotholeEvent>> => {
        return withFallback(
            async () => {
                const params: any = {
                    page: filters?.page || 1,
                    limit: filters?.limit || 1000, // Large limit for map if needed, or implement true tiling
                };
                if (filters?.status) params.status = filters.status;
                if (filters?.provincialCouncil) params.provincialCouncil = filters.provincialCouncil;
                const query = new URLSearchParams(params).toString();
                const res = await apiClient.get(`/reports?${query}`);
                return {
                    ...res,
                    data: Array.isArray(res.data) ? res.data.map(mapReportToPotholeEvent) : []
                };
            },
            async () => ({ data: [], total: 0, page: 1, limit: 10, total_pages: 0 })
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
    updateStatus: async (id: string, status: PotholeStatus, note: string, _updatedBy?: string): Promise<void> => {
        return withFallback(
            async () => {
                await apiClient.patch(`/reports/${id}/status`, { status, notes: note });
            },
            async () => {}
        );
    },
    scheduleRepair: async (id: string, data: RepairScheduleInput, _updatedBy?: string): Promise<PotholeEvent | null> => {
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
    listUsers: async (filters?: { 
        page?: number; 
        limit?: number;
        search?: string;
        role?: string;
        provincialCouncil?: string;
    }): Promise<PaginatedResponse<any>> => {
        try {
            const params: any = {
                page: filters?.page || 1,
                limit: filters?.limit || 10,
            };
            if (filters?.search) params.search = filters.search;
            if (filters?.role) params.role = filters.role;
            if (filters?.provincialCouncil) params.provincialCouncil = filters.provincialCouncil;
            
            const query = new URLSearchParams(params).toString();
            return await apiClient.get(`/auth/users?${query}`);
        } catch {
            return { data: [], total: 0, page: 1, limit: 10, total_pages: 0 };
        }
    },
    updateUserStatus: async (userId: string, status: 'ACTIVE' | 'DEACTIVATED'): Promise<void> => {
        await apiClient.patch(`/auth/users/${userId}`, { account_status: status });
    },
    getUserById: async (userId: string): Promise<any> => {
        return await apiClient.get(`/auth/users/${userId}`);
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
    list: async (filters?: { page?: number; limit?: number; action?: string; search?: string }): Promise<PaginatedResponse<AuditLog>> => {
        return withFallback(
            async () => {
                const params = new URLSearchParams({
                    page: String(filters?.page || 1),
                    limit: String(filters?.limit || 10),
                });
                if (filters?.action) params.append('action', filters.action);
                if (filters?.search) params.append('search', filters.search);
                
                const res = await apiClient.get(`/reports/history?${params.toString()}`);
                return {
                    ...res,
                    data: Array.isArray(res.data) ? res.data.map(normalizeAuditLog) : []
                };
            },
            async () => ({ data: [], total: 0, page: 1, limit: 10, total_pages: 0 })
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
