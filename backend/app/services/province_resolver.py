import logging

logger = logging.getLogger(__name__)

# Canonical mapping from province to its districts
PROVINCE_DISTRICTS = {
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
}

# Approximate bounding boxes for Sri Lankan provinces
# format: [min_lat, max_lat, min_lon, max_lon]
PROVINCE_BOUNDARIES = [
    ('Western Provincial Council', [6.65, 7.35, 79.70, 80.25]),
    ('Central Provincial Council', [7.00, 7.75, 80.20, 81.10]),
    ('Southern Provincial Council', [5.90, 6.65, 80.00, 81.40]),
    ('Northern Provincial Council', [9.00, 9.85, 79.50, 80.70]),
    ('Eastern Provincial Council', [7.00, 8.90, 81.10, 81.90]),
    ('North Western Provincial Council', [7.35, 8.30, 79.60, 80.40]),
    ('North Central Provincial Council', [7.75, 9.00, 80.00, 81.10]),
    ('Uva Provincial Council', [6.50, 7.50, 80.70, 81.40]),
    ('Sabaragamuwa Provincial Council', [6.40, 7.10, 80.10, 80.80]),
]

def resolve_province_and_district(lat: float, lon: float):
    """
    Determines the province and district based on latitude and longitude.
    """
    logger.info(f"Resolving location: Lat={lat}, Lon={lon}")
    
    detected_province = "Unassigned"
    
    for province, (min_lat, max_lat, min_lon, max_lon) in PROVINCE_BOUNDARIES:
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            detected_province = province
            break
            
    districts = PROVINCE_DISTRICTS.get(detected_province, ["Unknown"])
    detected_district = districts[0] if districts else "Unknown"
    
    logger.info(f"Detected: Province='{detected_province}', District='{detected_district}'")
    
    return detected_province, detected_district
