export interface DetectionResult {
    aiStatus: 'ACCEPTED' | 'REJECTED' | 'PENDING';
    confidence: number;
    bbox?: [number, number, number, number]; // [x, y, w, h] in relative format
    message: string;
    modelName: string;
    modelVersion: string;
    inferenceTimeMs: number;
}

/**
 * Simulates an AI Validation Service using YOLOv8.
 * Designed to be easily replaced by a real FastAPI backend endpoint:
 * 
 * Example future implementation:
 * const response = await fetch('http://localhost:8000/api/v1/detect', {
 *   method: 'POST',
 *   body: formData
 * });
 * return await response.json();
 */
export const simulateYoloDetection = async (_imageUrl: string): Promise<DetectionResult> => {
    return new Promise((resolve) => {
        const inferenceTime = 800 + Math.random() * 2400; // Simulate 800 - 3200ms processing time
        
        setTimeout(() => {
            const random = Math.random();
            let confidence = random;
            let aiStatus: 'ACCEPTED' | 'REJECTED' | 'PENDING' = 'PENDING';
            let bbox: [number, number, number, number] | undefined;
            let message = '';

            // Threshold logic
            if (random > 0.75) {
                // High confidence -> Automatically ACCEPTED
                aiStatus = 'ACCEPTED';
                message = 'High confidence detection. Automatically accepted and converted to active pothole.';
                confidence = 0.75 + Math.random() * 0.24; // 0.75 - 0.99
                
                // Generate realistic bounding box
                const w = 0.15 + Math.random() * 0.2; 
                const h = 0.15 + Math.random() * 0.2; 
                const x = 0.35 + Math.random() * 0.3; 
                const y = 0.5 + Math.random() * 0.3;  
                bbox = [x, y, w, h];
            } else if (random > 0.35) {
                // Low confidence -> PENDING (Review Queue)
                aiStatus = 'PENDING';
                message = 'Low confidence detection. Sent to Review Queue for manual verification.';
                confidence = 0.35 + Math.random() * 0.4; // 0.35 - 0.75
                
                const w = 0.1 + Math.random() * 0.15; 
                const h = 0.1 + Math.random() * 0.15; 
                const x = 0.2 + Math.random() * 0.6; 
                const y = 0.3 + Math.random() * 0.5;  
                bbox = [x, y, w, h];
            } else {
                // No pothole detected -> REJECTED (still reviewable by Admin)
                aiStatus = 'REJECTED';
                message = 'No pothole-like features detected in the image.';
                confidence = Math.random() * 0.35; // 0 - 0.35
                bbox = undefined;
            }

            resolve({
                aiStatus,
                confidence,
                bbox,
                message,
                modelName: "YOLOv8-Sim",
                modelVersion: "v1.0.mock",
                inferenceTimeMs: Math.round(inferenceTime)
            });
        }, inferenceTime);
    });
};
