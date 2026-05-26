import os
import uuid
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any

from analyzer import VLMAnalyzer

app = FastAPI(
    title="LoafRate API",
    description="Advanced AI Feline Batonization (Loafness) Evaluation Server",
    version="1.0.0"
)

# Enable CORS — origins controlled via CORS_ORIGINS env var (comma-separated)
# In production: set CORS_ORIGINS=https://yourdomain.com in .env
_raw_origins = os.environ.get("CORS_ORIGINS", "*")
cors_origins: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount uploads directory to serve files statically (so frontend can render the analyzed image)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Initialize VLM Analyzer (default to mock for MVP)
# Can set model_type="qwen2-vl" or "minicpm-v" with environment variables or config
MODEL_TYPE = os.environ.get("LOAF_MODEL_TYPE", "mock")
MODEL_PATH = os.environ.get("LOAF_MODEL_PATH", None)
analyzer = VLMAnalyzer(model_type=MODEL_TYPE, model_path=MODEL_PATH)

class HealthResponse(BaseModel):
    status: str
    model_type: str
    device: str

@app.get("/health", response_model=HealthResponse)
def health():
    """
    Health check endpoint to verify backend status and active VLM configuration.
    """
    return {
        "status": "healthy",
        "model_type": analyzer.model_type,
        "device": analyzer.device
    }

@app.post("/analyze")
async def analyze(image: UploadFile = File(...), lang: str = "en"):
    """
    Accepts an uploaded cat image, saves it locally, performs Batonization analysis,
    and returns a structured pseudo-scientific looksmaxxing assessment.
    """
    # 1. Validate file type
    content_type = image.content_type
    if not content_type or not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image.")

    # 2. Generate unique filename to prevent overwriting
    file_extension = os.path.splitext(image.filename)[1]
    if not file_extension:
        # Fallback if extension isn't found
        file_extension = ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # 3. Save the image locally
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded image: {str(e)}")

    # 4. Perform Batonization analysis
    try:
        report = analyzer.analyze_image(file_path, lang=lang)
    except Exception as e:
        # Cleanup file if analysis fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error performing loaf analysis: {str(e)}")

    # 5. Add image URL to the report so frontend can fetch it
    # Note: frontend needs to know where to find the image.
    # Serving it via the static mount `/uploads/filename`
    report["image_url"] = f"/uploads/{unique_filename}"
    report["filename"] = unique_filename

    return report

if __name__ == "__main__":
    import uvicorn
    # Read port from environment or default to 8000
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting LoafRate Backend on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
