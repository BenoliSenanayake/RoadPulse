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
export function getProvinceShortName(council: ProvincialCouncil): string {
    return council.replace(' Provincial Council', '');
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
