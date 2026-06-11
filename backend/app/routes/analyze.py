from fastapi import APIRouter, HTTPException
from app.models.schemas import PromptRequest, PromptResponse
from app.services.analyzer import analyze_prompt

router = APIRouter()


@router.post("/analyze", response_model=PromptResponse)
async def analyze(data: PromptRequest):
    try:
        return await analyze_prompt(data.prompt)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
