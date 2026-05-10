/**
 * Province Resolver for Sri Lanka
 * 
 * Uses approximate bounding boxes to determine which Provincial Council
 * a given GPS coordinate falls within. This is a prototype implementation
 * designed to be replaced later with a real GIS boundary or reverse geocoding API.
 */
import type { ProvincialCouncil } from '../types';

interface ProvinceBoundary {
    council: ProvincialCouncil;
    // Approximate bounding box [minLat, maxLat, minLon, maxLon]
    bounds: [number, number, number, number];
}

/**
 * Approximate bounding boxes for Sri Lanka's 9 provinces.
 * Order matters: more specific/smaller provinces should be checked first
 * to handle overlap in boundaries.
 */
const PROVINCE_BOUNDARIES: ProvinceBoundary[] = [
    {
        council: 'Western Provincial Council',
        bounds: [6.65, 7.35, 79.70, 80.25],
    },
    {
        council: 'Central Provincial Council',
        bounds: [7.00, 7.75, 80.20, 81.10],
    },
    {
        council: 'Southern Provincial Council',
        bounds: [5.90, 6.65, 80.00, 81.40],
    },
    {
        council: 'Northern Provincial Council',
        bounds: [9.00, 9.85, 79.50, 80.70],
    },
    {
        council: 'Eastern Provincial Council',
        bounds: [7.00, 8.90, 81.10, 81.90],
    },
    {
        council: 'North Western Provincial Council',
        bounds: [7.35, 8.30, 79.60, 80.40],
    },
    {
        council: 'North Central Provincial Council',
        bounds: [7.75, 9.00, 80.00, 81.10],
    },
    {
        council: 'Uva Provincial Council',
        bounds: [6.50, 7.50, 80.70, 81.40],
    },
    {
        council: 'Sabaragamuwa Provincial Council',
        bounds: [6.40, 7.10, 80.10, 80.80],
    },
];

export interface ProvinceDetectionResult {
    council: ProvincialCouncil;
    method: 'GPS_BOUNDARY' | 'MANUAL' | 'UNKNOWN';
    confidence?: number; // 0-1, how confident we are in the assignment
}

/**
 * Resolve a lat/lon coordinate to a Provincial Council.
 * Returns 'Unassigned' if no match found.
 */
export function resolveProvince(lat: number, lon: number): ProvinceDetectionResult {
    for (const boundary of PROVINCE_BOUNDARIES) {
        const [minLat, maxLat, minLon, maxLon] = boundary.bounds;
        if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
            return {
                council: boundary.council,
                method: 'GPS_BOUNDARY',
                confidence: 0.85, // approximate boundary matching
            };
        }
    }

    // Fallback: find the closest province by center distance
    let closest: ProvincialCouncil = 'Unassigned';
    let minDist = Infinity;
    for (const boundary of PROVINCE_BOUNDARIES) {
        const [minLat, maxLat, minLon, maxLon] = boundary.bounds;
        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;
        const dist = Math.sqrt((lat - centerLat) ** 2 + (lon - centerLon) ** 2);
        if (dist < minDist && dist < 1.0) { // within ~100km
            minDist = dist;
            closest = boundary.council;
        }
    }

    if (closest !== 'Unassigned') {
        return {
            council: closest,
            method: 'GPS_BOUNDARY',
            confidence: 0.5, // less confident — nearest match
        };
    }

    return {
        council: 'Unassigned',
        method: 'UNKNOWN',
        confidence: 0,
    };
}

/**
 * Get the display-friendly short name of a Provincial Council.
 */
export function getProvinceShortName(council?: ProvincialCouncil | string | null): string {
    if (!council) return 'Unassigned';
    return String(council).replace(' Provincial Council', '');
}

export const PROVINCIAL_COUNCILS: ProvincialCouncil[] = [
    'Western Provincial Council',
    'Central Provincial Council',
    'Southern Provincial Council',
    'Northern Provincial Council',
    'Eastern Provincial Council',
    'North Western Provincial Council',
    'North Central Provincial Council',
    'Uva Provincial Council',
    'Sabaragamuwa Provincial Council',
];

export const PROVINCE_DISTRICTS: Record<ProvincialCouncil, string[]> = {
    'Western Provincial Council': ['Colombo', 'Gampaha', 'Kalutara'],
    'Central Provincial Council': ['Kandy', 'Matale', 'Nuwara Eliya'],
    'Southern Provincial Council': ['Galle', 'Matara', 'Hambantota'],
    'Northern Provincial Council': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
    'Eastern Provincial Council': ['Trincomalee', 'Batticaloa', 'Ampara'],
    'North Western Provincial Council': ['Kurunegala', 'Puttalam'],
    'North Central Provincial Council': ['Anuradhapura', 'Polonnaruwa'],
    'Uva Provincial Council': ['Badulla', 'Monaragala'],
    'Sabaragamuwa Provincial Council': ['Ratnapura', 'Kegalle'],
    'Unassigned': []
};

export function getDistrictsByProvince(province: ProvincialCouncil): string[] {
    return PROVINCE_DISTRICTS[province] || [];
}

/**
 * Robust province string normalization for cross-system comparison.
 * Handles casing, trimming, and official suffix mapping.
 */
export function normalizeProvince(value?: string | null): string {
    const clean = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    if (!clean) return '';
    if (clean === 'unassigned' || clean === 'none_assigned') return 'unassigned';

    const base = clean
        .replace(/\s+provincial council$/, '')
        .replace(/\s+province$/, '');

    const mapping: Record<string, string> = {
        'western': 'western provincial council',
        'central': 'central provincial council',
        'southern': 'southern provincial council',
        'northern': 'northern provincial council',
        'eastern': 'eastern provincial council',
        'north western': 'north western provincial council',
        'north central': 'north central provincial council',
        'uva': 'uva provincial council',
        'sabaragamuwa': 'sabaragamuwa provincial council',
    };

    return mapping[base] || clean;
}

export function normalizeDistrict(value?: string | null): string {
    const clean = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/[.,;:()[\]]/g, ' ')
        .replace(/\bdistrict\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!clean) return '';

    const knownDistricts = Object.values(PROVINCE_DISTRICTS).flat();
    for (const district of knownDistricts) {
        const normalizedDistrict = String(district)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
        const districtPattern = new RegExp(`(^|\\s)${normalizedDistrict.replace(/\s+/g, '\\s+')}(\\s|$)`);
        if (clean === normalizedDistrict || districtPattern.test(clean)) {
            return normalizedDistrict;
        }
    }

    return clean;
}

const CANONICAL_PROVINCES: Record<string, ProvincialCouncil> = {
    'western provincial council': 'Western Provincial Council',
    'central provincial council': 'Central Provincial Council',
    'southern provincial council': 'Southern Provincial Council',
    'northern provincial council': 'Northern Provincial Council',
    'eastern provincial council': 'Eastern Provincial Council',
    'north western provincial council': 'North Western Provincial Council',
    'north central provincial council': 'North Central Provincial Council',
    'uva provincial council': 'Uva Provincial Council',
    'sabaragamuwa provincial council': 'Sabaragamuwa Provincial Council',
    'unassigned': 'Unassigned',
};

export function canonicalizeProvince(value?: string | null): ProvincialCouncil {
    return CANONICAL_PROVINCES[normalizeProvince(value)] || 'Unassigned';
}

export const PROVINCE_CENTERS: Record<ProvincialCouncil, [number, number]> = {
    'Western Provincial Council': [6.9271, 79.8612],
    'Central Provincial Council': [7.2906, 80.6337],
    'Southern Provincial Council': [6.0535, 80.2210],
    'Northern Provincial Council': [9.6615, 80.0255],
    'Eastern Provincial Council': [7.7170, 81.7000],
    'North Western Provincial Council': [7.4863, 80.3647],
    'North Central Provincial Council': [8.3114, 80.4037],
    'Uva Provincial Council': [6.9934, 81.0550],
    'Sabaragamuwa Provincial Council': [6.6828, 80.3992],
    'Unassigned': [7.8731, 80.7718],
};

export function getProvinceCenter(value?: string | null): [number, number] {
    return PROVINCE_CENTERS[canonicalizeProvince(value)];
}
