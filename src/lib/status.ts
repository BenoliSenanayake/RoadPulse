import type { CitizenReport } from '../types';

export type CanonicalReportStatus = Exclude<CitizenReport['status'], 'Discarded'>;

const NORMALIZED_TO_CANONICAL: Record<string, CanonicalReportStatus> = {
    'new': 'New',
    'pending': 'New',
    'under review': 'New',
    'needs manual review': 'New',
    'verified': 'Verified',
    'confirmed': 'Verified',
    'accepted': 'Verified',
    'verified pothole': 'Verified',
    'scheduled': 'Scheduled',
    'repair scheduled': 'Scheduled',
    'scheduled repair': 'Scheduled',
    'awaiting crew': 'Scheduled',
    'in progress': 'In Progress',
    'repair in progress': 'In Progress',
    'completed': 'Completed',
    'fixed': 'Completed',
    'repair completed': 'Completed',
    'rejected': 'Rejected',
    'discarded': 'Rejected',
    'unable to repair': 'Rejected',
    'non pothole': 'Rejected',
};

export function normalizeStatus(value?: string | null): string {
    const clean = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ');

    return NORMALIZED_TO_CANONICAL[clean]?.toLowerCase() || clean;
}

export function canonicalizeStatus(value?: string | null): CanonicalReportStatus {
    const normalized = normalizeStatus(value);
    const canonical = NORMALIZED_TO_CANONICAL[normalized];
    return canonical || 'New';
}

export function statusEquals(value: string | null | undefined, expected: CanonicalReportStatus): boolean {
    return canonicalizeStatus(value) === expected;
}
