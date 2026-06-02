from fastapi import APIRouter
from app.models.schemas import (
    PromptRequest,
    PromptResponse
)

from app.services.analyzer import (
    analyze_prompt
)

router = APIRouter()

@router.post(
    "/analyze",
    response_model=PromptResponse
)
def analyze(data: PromptRequest):

    result = analyze_prompt(
        data.prompt
    )

    return result