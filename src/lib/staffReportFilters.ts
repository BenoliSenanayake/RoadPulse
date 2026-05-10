import type { CitizenReport, ProvincialCouncil } from '../types';
import { normalizeProvince } from './provinceResolver';

export const OFFICER_PROVINCE_MISSING = 'Officer province is missing. Please sign in again.';

export function hasOfficerProvince(value?: string | null): value is ProvincialCouncil {
    return Boolean(value) && normalizeProvince(value) !== 'unassigned';
}

export function filterReportsForProvince<T extends { provincialCouncil?: string | null }>(
    reports: T[],
    province?: string | null
): T[] {
    const officerProvince = normalizeProvince(province);
    return reports.filter(report => normalizeProvince(report.provincialCouncil) === officerProvince);
}

export function isVerifiedReport(report: CitizenReport): boolean {
    return report.status === 'Verified' || report.aiClassification === 'VERIFIED_POTHOLE';
}

export function isManualReviewReport(report: CitizenReport): boolean {
    return report.status === 'New' || report.aiClassification === 'NEEDS_MANUAL_REVIEW';
}

export function isInProgressReport(report: CitizenReport): boolean {
    return report.status === 'In Progress';
}

export function isCompletedReport(report: CitizenReport): boolean {
    return report.status === 'Completed';
}

export function isRejectedReport(report: CitizenReport): boolean {
    return report.status === 'Rejected' || report.aiClassification === 'REJECTED';
}

export function isOverdueReport(report: CitizenReport): boolean {
    if (!['New', 'Verified'].includes(report.status) || !report.createdAt) return false;
    const createdDate = new Date(report.createdAt);
    const diffDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 14;
}
