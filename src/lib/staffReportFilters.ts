import type { CitizenReport, ProvincialCouncil } from '../types';
import { normalizeProvince } from './provinceResolver';
import { canonicalizeStatus, normalizeStatus } from './status';

export const OFFICER_PROVINCE_MISSING = 'Officer province is missing. Please sign in again.';

export function hasOfficerProvince(value?: string | null): value is ProvincialCouncil {
    const normalized = normalizeProvince(value);
    return Boolean(value) && normalized !== '' && normalized !== 'unassigned';
}

export function filterReportsForProvince<T extends { provincialCouncil?: string | null }>(
    reports: T[],
    province?: string | null
): T[] {
    const officerProvince = normalizeProvince(province);
    return reports.filter(report => normalizeProvince(report.provincialCouncil) === officerProvince);
}

export function isVerifiedReport(report: CitizenReport): boolean {
    return canonicalizeStatus(report.status) === 'Verified';
}

export function isManualReviewReport(report: CitizenReport): boolean {
    const status = canonicalizeStatus(report.status);
    return status === 'New'
        || (report.aiClassification === 'NEEDS_MANUAL_REVIEW'
            && !['Verified', 'Scheduled', 'In Progress', 'Completed', 'Rejected'].includes(status));
}

export function isInProgressReport(report: CitizenReport): boolean {
    return canonicalizeStatus(report.status) === 'In Progress';
}

export function isCompletedReport(report: CitizenReport): boolean {
    return canonicalizeStatus(report.status) === 'Completed';
}

export function isRejectedReport(report: CitizenReport): boolean {
    return canonicalizeStatus(report.status) === 'Rejected';
}

export function isOverdueReport(report: CitizenReport): boolean {
    const status = canonicalizeStatus(report.status);
    if (!['New', 'Verified', 'Scheduled'].includes(status) || !report.createdAt) return false;
    const createdDate = new Date(report.createdAt);
    const diffDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 14;
}

export function logStaffReportFilter(
    scope: string,
    officerProvince: string | null | undefined,
    allReports: CitizenReport[],
    filteredReports: CitizenReport[]
) {
    console.log(`[${scope}] Logged officer province:`, officerProvince);
    console.log(`[${scope}] Total reports fetched:`, allReports.length);
    console.log(`[${scope}] Filtered reports count:`, filteredReports.length);
    console.log(`[${scope}] Filtered report statuses:`, Array.from(new Set(filteredReports.map(report => normalizeStatus(report.status)))));
    console.log(`[${scope}] Filtered report provinces:`, Array.from(new Set(filteredReports.map(report => report.provincialCouncil || 'Unassigned'))));
}
