from fastapi import APIRouter, HTTPException
from app.models.schemas import PromptRequest
from app.services.analyzer import analyze_prompt
from app.services.attacker import generate_attacks

router = APIRouter()


@router.post("/attacks")
async def create_attacks(data: PromptRequest):
    try:
        analysis = await analyze_prompt(data.prompt)
        return await generate_attacks(
            prompt=data.prompt,
            category=analysis["category"],
            intent=analysis["intent"]
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
