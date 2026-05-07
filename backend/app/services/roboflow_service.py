import os
from datetime import datetime

try:
    from inference_sdk import InferenceHTTPClient
except ImportError:
    # Fallback/stub if library is not installed locally
    class InferenceHTTPClient:
        def __init__(self, api_url, api_key):
            self.api_url = api_url
            self.api_key = api_key
        def infer(self, image_path, model_id):
            return {"predictions": []}

# Requirements:
# - Store API key in environment variables
# - Do NOT expose API key to frontend
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")

CLIENT = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=ROBOFLOW_API_KEY
)

import asyncio

async def analyze_pothole_image(image_path: str) -> dict:
    """
    Analyzes an image using the Roboflow pothole detection model.
    """
    result = {
        "detected": False,
        "aiClassification": "NEEDS_MANUAL_REVIEW",
        "aiConfidence": 0.0,
        "predictionCount": 0,
        "bbox": None,
        "predictions": [],
        "raw_response": {}
    }
    
    try:
        # 1. Send image to model (run synchronous infer in a thread pool to avoid blocking)
        response = await asyncio.to_thread(CLIENT.infer, image_path, model_id="pothole-voxrl/1")
        
        # 2. Parse Roboflow response
        result["raw_response"] = response
        
        predictions = response.get("predictions", [])
        result["predictionCount"] = len(predictions)
        result["predictions"] = predictions
        
        if predictions:
            # 4. Use highest confidence prediction as primary result if multiple potholes exist
            best_prediction = max(predictions, key=lambda p: p.get("confidence", 0))
            
            # 3. Extract confidence, class, bbox coordinates
            confidence = best_prediction.get("confidence", 0)
            
            result["detected"] = True
            result["aiConfidence"] = float(confidence)
            
            image_info = response.get("image", {})
            img_w = image_info.get("width", 1)
            img_h = image_info.get("height", 1)
            
            # Convert center x,y to top-left x,y and normalize to 0-1
            x = best_prediction.get("x", 0)
            y = best_prediction.get("y", 0)
            w = best_prediction.get("width", 0)
            h = best_prediction.get("height", 0)
            
            if img_w > 1 and img_h > 1:
                norm_w = w / img_w
                norm_h = h / img_h
                norm_x = (x - w / 2) / img_w
                norm_y = (y - h / 2) / img_h
                result["bbox"] = [norm_x, norm_y, norm_w, norm_h]
            else:
                result["bbox"] = [x, y, w, h]
            
            # 3. CLASSIFICATION LOGIC
            if confidence >= 0.75:
                result["aiClassification"] = "VERIFIED_POTHOLE"
            elif confidence >= 0.50:
                result["aiClassification"] = "NEEDS_MANUAL_REVIEW"
            else:
                result["aiClassification"] = "REJECTED"
        else:
            # Low confidence < 0.50: REJECTED (Since there are no predictions, it's effectively 0 confidence)
            result["aiClassification"] = "REJECTED"
            
    except Exception as e:
        # If inference fails: classification = NEEDS_MANUAL_REVIEW
        print(f"Error during Roboflow inference: {e}")
        result["aiClassification"] = "NEEDS_MANUAL_REVIEW"
        
    # 6. Return standardized result
    return result
