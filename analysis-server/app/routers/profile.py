from fastapi import APIRouter
from app.schemas.analysis import ProfileRequest, ProfileResponse
from app.services.analyzer import AnalyzerService

router = APIRouter()
analyzer = AnalyzerService()


@router.post("/profile", response_model=ProfileResponse)
async def analyze_profile(request: ProfileRequest):
    """
    Analyze investment profile based on survey responses.

    - Risk Score: 0-100 scale
    - Loss Aversion Index: 0-10 scale
    - Investment Type: conservative, moderate, aggressive
    """
    result = analyzer.analyze_profile(request.survey_data)
    return result
