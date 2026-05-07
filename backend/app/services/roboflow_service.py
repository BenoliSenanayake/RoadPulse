import os
import requests
import asyncio
from app.config import settings

try:
    from inference_sdk import InferenceHTTPClient
except ImportError:
    # Fallback/stub if library is not installed due to Python version
    class InferenceHTTPClient:
        def __init__(self, api_url, api_key):
            self.api_url = api_url
            self.api_key = api_key
        def infer(self, image_path, model_id):
            print(f"Fallback inference for {model_id} via requests...")
            # We can use requests to hit Roboflow API directly if SDK fails
            url = f"https://detect.roboflow.com/pothole-voxrl/1?api_key={self.api_key}"
            with open(image_path, "rb") as image_file:
                resp = requests.post(url, files={"file": image_file})
            if resp.status_code == 200:
                return resp.json()
            return {"predictions": [], "image": {"width": 1, "height": 1}}

CLIENT = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=settings.ROBOFLOW_API_KEY
)

async def analyze_pothole_image(image_path: str) -> dict:
    result = {
        "detected": False,
        "aiClassification": "NEEDS_MANUAL_REVIEW",
        "aiConfidence": 0.0,
        "predictionCount": 0,
        "bbox": None,
        "predictions": [],
        "raw_response": {},
        "detectionModel": "pothole-voxrl/1"
    }
    
    try:
        response = await asyncio.to_thread(CLIENT.infer, image_path, model_id="pothole-voxrl/1")
        result["raw_response"] = response
        
        predictions = response.get("predictions", [])
        result["predictionCount"] = len(predictions)
        result["predictions"] = predictions
        
        if predictions:
            best_prediction = max(predictions, key=lambda p: p.get("confidence", 0))
            confidence = float(best_prediction.get("confidence", 0))
            
            result["detected"] = True
            result["aiConfidence"] = confidence
            
            # Normalize bbox coordinates
            image_info = response.get("image", {})
            img_w = image_info.get("width", 1)
            img_h = image_info.get("height", 1)
            
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
            
            # Classification rules
            if confidence >= 0.75:
                result["aiClassification"] = "VERIFIED_POTHOLE"
            elif confidence >= 0.50:
                result["aiClassification"] = "NEEDS_MANUAL_REVIEW"
            else:
                result["aiClassification"] = "REJECTED"
        else:
            result["aiClassification"] = "REJECTED"
            
    except Exception as e:
        print(f"Error during Roboflow inference: {e}")
        result["aiClassification"] = "NEEDS_MANUAL_REVIEW"
        
    return result
