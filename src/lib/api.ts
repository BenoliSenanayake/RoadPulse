import {
    submitReport as mockSubmitReport,
    getReports as mockGetReports,
    processReport as mockProcessReport,
    getPotholes as mockGetPotholes,
    updatePotholeStatus as mockUpdatePotholeStatus,
    schedulePotholeRepair as mockSchedulePotholeRepair,
    getSystemSettings,
    MOCK_USERS
} from '../mockData';
import type { CitizenReport, PotholeEvent, PotholeStatus, RepairScheduleInput } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const USE_MOCK = false; // Changed to false to use backend

export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET' });
        return response.ok;
    } catch {
        return false;
    }
};

// Helper for fallback
async function withFallback<T>(apiCall: () => Promise<T>, mockFallback: () => Promise<T> | T): Promise<T> {
    if (USE_MOCK) return mockFallback();
    try {
        return await apiCall();
    } catch (e) {
        console.warn('Backend call failed, falling back to mock data:', e);
        return mockFallback();
    }
}

// ==========================================
// BASE API CLIENT
// ==========================================
const apiClient = {
    async get(endpoint: string) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    },
    async post(endpoint: string, data: any) {
        const isFormData = data instanceof FormData;
        const options: RequestInit = {
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data),
        };
        if (!isFormData) {
            options.headers = { 'Content-Type': 'application/json' };
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
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

// ==========================================
// API MODULES
// ==========================================

export const authApi = {
    login: async (email: string, password?: string) => {
        return withFallback(
            () => apiClient.post('/auth/login', { email, password }),
            () => ({ token: 'mock-token', user: { id: 'u1', name: 'Admin Hub', role: 'ADMIN' } })
        );
    },
    logout: async () => {
        return withFallback(
            () => apiClient.post('/auth/logout', {}),
            () => ({ success: true })
        );
    },
    verifyStaff: async (email: string) => {
        return withFallback(
            async () => {
                const users = await apiClient.get('/users');
                return users.find((u: any) => u.email === email && u.role !== 'CITIZEN') || null;
            },
            () => MOCK_USERS.find(u => u.email === email && u.role !== 'CITIZEN') || null
        );
    },
    checkEmailExists: async (email: string) => {
        return withFallback(
            async () => {
                const users = await apiClient.get('/users');
                return users.some((u: any) => u.email === email);
            },
            () => MOCK_USERS.some(u => u.email === email)
        );
    },
    listUsers: async () => {
        return withFallback(
            () => apiClient.get('/users'),
            async () => {
                const stored = localStorage.getItem('rp_users');
                if (stored) return JSON.parse(stored);
                localStorage.setItem('rp_users', JSON.stringify(MOCK_USERS));
                return MOCK_USERS;
            }
        );
    },
    updateUserStatus: async (userId: string, status: 'ACTIVE' | 'DISABLED') => {
        return withFallback(
            () => apiClient.patch(`/users/${userId}/status`, { status }),
            async () => {
                const stored = localStorage.getItem('rp_users');
                const users = stored ? JSON.parse(stored) : [...MOCK_USERS];
                const index = users.findIndex((u: any) => u.id === userId);
                if (index !== -1) {
                    users[index].status = status;
                    localStorage.setItem('rp_users', JSON.stringify(users));
                }
                return { success: true };
            }
        );
    }
};
    
const mapBackendReportToFrontend = (data: any): CitizenReport => {
    if (!data) return data;
    return {
        ...data,
        id: data.id,
        citizenId: data.citizen_id || data.citizenId,
        lat: data.latitude || data.lat,
        lon: data.longitude || data.lon,
        imageUrl: data.image_url || data.imageUrl,
        aiClassification: data.ai_classification || data.aiClassification,
        aiConfidence: data.ai_confidence || data.aiConfidence,
        predictionCount: data.prediction_count || data.predictionCount,
        detectionModel: data.detection_model || data.detectionModel,
        detectionTimestamp: data.detection_timestamp || data.detectionTimestamp,
        createdAt: data.submitted_at || data.createdAt || new Date().toISOString(),
        provincialCouncil: data.provincial_council || data.provincialCouncil,
    };
};

const mapReportToPotholeEvent = (data: any): PotholeEvent => {
    if (!data) return data;
    const cr = mapBackendReportToFrontend(data);
    return {
        id: cr.id,
        lat: cr.lat,
        lon: cr.lon,
        timestamp: cr.createdAt || new Date().toISOString(),
        confidence: cr.aiConfidence ?? 0.9,
        status: (cr.status as PotholeStatus) || 'New',
        imageUrl: cr.imageUrl,
        source: 'CITIZEN_REPORT',
        reportId: cr.id,
        bbox: cr.bbox,
        provincialCouncil: cr.provincialCouncil,
        district: cr.district,
        createdAt: cr.createdAt || new Date().toISOString(),
        updatedAt: cr.createdAt || new Date().toISOString(),
        priority: data.priority,
        assignedTeam: data.assigned_team || data.assignedTeam,
        scheduledDate: data.scheduled_date || data.scheduledDate,
        maintenanceNotes: data.maintenance_notes || data.maintenanceNotes,
        repairStatus: data.repair_status || data.repairStatus || cr.status,
    };
};

export const reportsApi = {
    list: async (filters?: { status?: string; citizenId?: string }): Promise<CitizenReport[]> => {
        return withFallback(
            async () => {
                const query = new URLSearchParams(filters as any).toString();
                const res = await apiClient.get(`/reports?${query}`);
                return Array.isArray(res) ? res.map(mapBackendReportToFrontend) : [];
            },
            async () => {
                await new Promise(r => setTimeout(r, 400));
                let reports = mockGetReports();
                if (filters?.status) reports = reports.filter(r => r.aiStatus === filters.status);
                if (filters?.citizenId) reports = reports.filter(r => r.citizenId === filters.citizenId);
                return reports;
            }
        );
    },
    submit: async (data: any): Promise<CitizenReport> => {
        return withFallback(
            async () => {
                const res = await apiClient.post('/reports', data);
                return mapBackendReportToFrontend(res);
            },
            async () => {
                await new Promise(r => setTimeout(r, 600));
                let payload = data;
                if (data instanceof FormData) {
                    payload = {
                        citizenId: (data.get('citizen_id') || data.get('citizenId')) as string,
                        lat: parseFloat((data.get('latitude') || data.get('lat')) as string),
                        lon: parseFloat((data.get('longitude') || data.get('lon')) as string),
                        description: data.get('description') as string,
                        imageUrl: data.get('image') instanceof File ? URL.createObjectURL(data.get('image') as File) : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80',
                        aiStatus: 'PENDING'
                    };
                }
                if (!payload.citizenId) {
                    throw new Error('Reports must be linked to a registered citizen.');
                }
                return mockSubmitReport(payload);
            }
        );
    },
    review: async (id: string, action: 'accept' | 'reject' | 'request_info', reason?: string): Promise<void> => {
        return withFallback(
            () => {
                let status = 'New';
                if (action === 'accept') status = 'Verified';
                else if (action === 'reject') status = 'Rejected';
                else if (action === 'request_info') status = 'Discarded';
                return apiClient.patch(`/reports/${id}/status`, { status, notes: reason });
            },
            async () => {
                await new Promise(r => setTimeout(r, 300));
                return mockProcessReport(id, action, reason);
            }
        );
    },
    getById: async (id: string): Promise<CitizenReport | null> => {
        return withFallback(
            async () => {
                const res = await apiClient.get(`/reports/${id}`);
                return mapBackendReportToFrontend(res);
            },
            async () => {
                await new Promise(r => setTimeout(r, 300));
                return mockGetReports().find(r => r.id === id) || null;
            }
        );
    },
    update: async (id: string, updates: Partial<CitizenReport>): Promise<CitizenReport | null> => {
        return withFallback(
            async () => {
                // Map frontend updates back to backend if needed (e.g. notes)
                const payload: any = { ...updates };
                const res = await apiClient.patch(`/reports/${id}`, payload);
                return mapBackendReportToFrontend(res);
            },
            async () => {
                const { updateReportDetails } = await import('../mockData');
                return updateReportDetails(id, updates);
            }
        );
    }
};

export const potholesApi = {
    list: async (filters?: { status?: PotholeStatus }): Promise<PotholeEvent[]> => {
        return withFallback(
            async () => {
                const query = new URLSearchParams(filters as any).toString();
                const res = await apiClient.get(`/reports?${query}`);
                return Array.isArray(res) ? res.map(mapReportToPotholeEvent) : [];
            },
            async () => {
                await new Promise(r => setTimeout(r, 400));
                let potholes = mockGetPotholes();
                if (filters?.status) potholes = potholes.filter(p => p.status === filters.status);
                return potholes;
            }
        );
    },
    getById: async (id: string): Promise<PotholeEvent | null> => {
        return withFallback(
            async () => {
                const res = await apiClient.get(`/reports/${id}`);
                return mapReportToPotholeEvent(res);
            },
            async () => {
                await new Promise(r => setTimeout(r, 200));
                return mockGetPotholes().find(p => p.id === id) || null;
            }
        );
    },
    updateStatus: async (id: string, status: PotholeStatus, note: string, updatedBy?: string): Promise<void> => {
        return withFallback(
            async () => {
                await apiClient.patch(`/reports/${id}/status`, { status, notes: note });
            },
            async () => {
                await new Promise(r => setTimeout(r, 300));
                return mockUpdatePotholeStatus(id, status, note, updatedBy || 'System');
            }
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
            async () => {
                await new Promise(r => setTimeout(r, 300));
                return mockSchedulePotholeRepair(id, data, updatedBy || 'Maintenance Officer');
            }
        );
    }
};

export const repairsApi = {
    schedule: async (potholeId: string, teamId: string, scheduledDate: string) => {
        return withFallback(
            async () => {
                const payload = {
                    status: 'Scheduled',
                    notes: `Scheduled repair with ${teamId} on ${scheduledDate}`
                };
                return apiClient.patch(`/reports/${potholeId}/status`, payload);
            },
            async () => {
                await new Promise(r => setTimeout(r, 300));
                return mockSchedulePotholeRepair(potholeId, {
                    priority: 'Medium',
                    assignedTeam: teamId as any,
                    scheduledDate,
                    maintenanceNotes: `Scheduled repair for ${teamId}`,
                    repairStatus: 'Scheduled'
                }, 'System');
            }
        );
    }
};

export const auditLogsApi = {
    list: async (entityId?: string) => {
        return withFallback(
            () => apiClient.get('/reports/history'),
            async () => {
                await new Promise(r => setTimeout(r, 200));
                const logs = JSON.parse(localStorage.getItem('rp_audit_logs') || '[]');
                if (entityId) return logs.filter((l: any) => l.entityId === entityId);
                return logs;
            }
        );
    }
};

export const settingsApi = {
    get: async () => {
        return withFallback(
            () => apiClient.get('/settings'),
            async () => {
                await new Promise(r => setTimeout(r, 200));
                return getSystemSettings();
            }
        );
    },
    update: async (settings: any) => {
        return withFallback(
            () => apiClient.patch('/settings', settings),
            async () => {
                await new Promise(r => setTimeout(r, 200));
                const current = getSystemSettings();
                Object.assign(current, settings);
                localStorage.setItem('rp_settings', JSON.stringify(current));
                return current;
            }
        );
    }
};

// ==========================================
// LEGACY COMPATIBILITY EXPORTS
// ==========================================
export const listCitizenReports = (filters?: { status?: string; citizenId?: string }) => {
    let reports = mockGetReports();
    if (filters?.status) reports = reports.filter(r => r.aiStatus === filters.status);
    if (filters?.citizenId) reports = reports.filter(r => r.citizenId === filters.citizenId);
    return reports;
};
export const submitCitizenReport = mockSubmitReport;
export const reviewCitizenReport = mockProcessReport;
export const listPotholes = (filters?: { status?: PotholeStatus }) => {
    let potholes = mockGetPotholes();
    if (filters?.status) potholes = potholes.filter(p => p.status === filters.status);
    return potholes;
};
export const getPotholeById = (id: string) => mockGetPotholes().find(p => p.id === id) || null;
export const updatePotholeStatus = (id: string, status: PotholeStatus, note: string, actor: string = 'System') => mockUpdatePotholeStatus(id, status, note, actor);
export const schedulePotholeRepair = mockSchedulePotholeRepair;
