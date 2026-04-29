import {
    submitReport as mockSubmitReport,
    getReports as mockGetReports,
    processReport as mockProcessReport,
    getPotholes as mockGetPotholes,
    updatePotholeStatus as mockUpdatePotholeStatus,
    getSystemSettings,
    MOCK_USERS
} from '../mockData';
import type { CitizenReport, PotholeEvent, PotholeStatus } from '../types';
import { simulateYoloDetection, type DetectionResult } from './aiValidationService';

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
            () => ({ token: 'mock-token', user: { id: 'u1', name: 'Admin', role: 'admin' } })
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
            () => MOCK_USERS
        );
    }
};

export const reportsApi = {
    list: async (filters?: { status?: string; citizenId?: string }): Promise<CitizenReport[]> => {
        return withFallback(
            () => {
                const query = new URLSearchParams(filters as any).toString();
                return apiClient.get(`/reports?${query}`);
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
            () => apiClient.post('/reports', data),
            async () => {
                await new Promise(r => setTimeout(r, 600));
                let payload = data;
                if (data instanceof FormData) {
                    payload = {
                        citizenId: data.get('citizenId') as string,
                        lat: parseFloat(data.get('lat') as string),
                        lon: parseFloat(data.get('lon') as string),
                        description: data.get('description') as string,
                        imageUrl: data.get('image') instanceof File ? URL.createObjectURL(data.get('image') as File) : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80',
                        aiStatus: 'PENDING'
                    };
                }
                return mockSubmitReport(payload);
            }
        );
    },
    review: async (id: string, action: 'accept' | 'reject' | 'request_info', reason?: string): Promise<void> => {
        return withFallback(
            () => apiClient.post(`/reports/${id}/review`, { action, reason }),
            async () => {
                await new Promise(r => setTimeout(r, 300));
                return mockProcessReport(id, action, reason);
            }
        );
    }
};

export const potholesApi = {
    list: async (filters?: { status?: PotholeStatus }): Promise<PotholeEvent[]> => {
        return withFallback(
            () => {
                const query = new URLSearchParams(filters as any).toString();
                return apiClient.get(`/potholes?${query}`);
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
            () => apiClient.get(`/potholes/${id}`),
            async () => {
                await new Promise(r => setTimeout(r, 200));
                return mockGetPotholes().find(p => p.id === id) || null;
            }
        );
    },
    updateStatus: async (id: string, status: PotholeStatus, note: string, updatedBy?: string): Promise<void> => {
        return withFallback(
            () => apiClient.patch(`/potholes/${id}/status`, { status, note, updatedBy }),
            async () => {
                await new Promise(r => setTimeout(r, 300));
                return mockUpdatePotholeStatus(id, status, note, updatedBy || 'System');
            }
        );
    }
};

export const repairsApi = {
    schedule: async (potholeId: string, teamId: string, scheduledDate: string) => {
        return withFallback(
            () => apiClient.post(`/repairs`, { potholeId, teamId, scheduledDate }),
            async () => {
                await new Promise(r => setTimeout(r, 300));
                return mockUpdatePotholeStatus(potholeId, 'Scheduled', `Scheduled repair for team ${teamId}`, 'System');
            }
        );
    }
};

export const auditLogsApi = {
    list: async (entityId?: string) => {
        return withFallback(
            () => apiClient.get(`/audit-logs${entityId ? `?entityId=${entityId}` : ''}`),
            async () => {
                await new Promise(r => setTimeout(r, 200));
                const logs = JSON.parse(localStorage.getItem('rp_audit_logs') || '[]');
                if (entityId) return logs.filter((l: any) => l.entityId === entityId);
                return logs;
            }
        );
    }
};

export const aiApi = {
    verifyImage: async (imageFile: File): Promise<DetectionResult> => {
        return withFallback(
            () => {
                const formData = new FormData();
                formData.append('image', imageFile);
                return apiClient.post('/api/ai/analyze', formData);
            },
            () => {
                const objectUrl = URL.createObjectURL(imageFile);
                return simulateYoloDetection(objectUrl);
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
// To avoid breaking the entire app instantly, we temporarily export synchronous versions 
// that bypass the new async flow. The pages will be incrementally updated.
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
