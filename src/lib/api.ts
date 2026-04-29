import {
    submitReport,
    getReports,
    processReport,
    getPotholes,
    updatePotholeStatus as mockUpdatePotholeStatus
} from '../mockData';
import type { CitizenReport, PotholeEvent, PotholeStatus } from '../types';

export const USE_MOCK = true;

export interface ReportFilters {
    citizenId?: string;
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface PotholeFilters {
    status?: PotholeStatus;
}

export const submitCitizenReport = async (formData: Parameters<typeof submitReport>[0]): Promise<CitizenReport> => {
    if (USE_MOCK) return submitReport(formData);
    throw new Error('API not implemented');
};

export const listCitizenReports = (filters?: ReportFilters): CitizenReport[] => {
    if (USE_MOCK) {
        let reports = getReports();
        if (filters?.status) reports = reports.filter(r => r.aiStatus === filters.status);
        if (filters?.citizenId) reports = reports.filter(r => r.citizenId === filters.citizenId);
        return reports;
    }
    throw new Error('API not implemented');
};

export const reviewCitizenReport = (id: string, action: 'accept' | 'reject' | 'request_info', reason?: string): void => {
    if (USE_MOCK) return processReport(id, action, reason);
    throw new Error('API not implemented');
};

export const listPotholes = (filters?: PotholeFilters): PotholeEvent[] => {
    if (USE_MOCK) {
        let potholes = getPotholes();
        if (filters?.status) potholes = potholes.filter(p => p.status === filters.status);
        return potholes;
    }
    throw new Error('API not implemented');
};

export const updatePotholeStatus = (id: string, status: PotholeStatus, note: string, updatedBy?: string): void => {
    if (USE_MOCK) {
        return mockUpdatePotholeStatus(id, status, note, updatedBy || 'System');
    }
    throw new Error('API not implemented');
};

export const getPotholeById = (id: string): PotholeEvent | null => {
    if (USE_MOCK) {
        return getPotholes().find(p => p.id === id) || null;
    }
    throw new Error('API not implemented');
};
