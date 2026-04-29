from fastapi import APIRouter, UploadFile, File
from ..schemas import DetectionResult
from ..services.ai_service import simulate_yolo_detection
import os
import uuid

router = APIRouter(prefix="/api/ai", tags=["ai"])
UPLOAD_DIR = "uploads"

@router.post("/analyze", response_model=DetectionResult)
async def analyze_image(image: UploadFile = File(...)):
    """
    Placeholder endpoint for direct image analysis.
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = image.filename.split(".")[-1]
    filename = f"temp_{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        content = await image.read()
        f.write(content)
        
    result = simulate_yolo_detection(file_path)
    
    # Clean up temp file
    if os.path.exists(file_path):
        os.remove(file_path)
        
    return result
