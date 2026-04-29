import random

def simulate_yolo_detection(image_path: str):
    """
    Placeholder service that mimics a YOLO object detection model.
    Returns mock detection results.
    """
    # Simulate some randomness
    confidence = random.uniform(0.3, 0.95)
    
    # Random relative bounding box
    x = random.uniform(0.1, 0.5)
    y = random.uniform(0.1, 0.5)
    w = random.uniform(0.2, 0.4)
    h = random.uniform(0.2, 0.4)
    
    if confidence > 0.6:
        return {
            "aiStatus": "ACCEPTED",
            "confidence": round(confidence, 2),
            "message": "Pothole detected",
            "bbox": [x, y, w, h]
        }
    else:
        return {
            "aiStatus": "REJECTED",
            "confidence": round(confidence, 2),
            "message": "No clear pothole identified",
            "bbox": None
        }
