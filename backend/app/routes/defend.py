from fastapi import APIRouter, HTTPException
from app.models.schemas import DefenseRequest, DefenseResult
from app.services.defense_synthesizer import synthesize_defense

router = APIRouter()


@router.post("/defend", response_model=DefenseResult)
async def defend(request: DefenseRequest):
    try:
        return await synthesize_defense(
            attack=request.attack,
            attack_category=request.attack_category,
            attack_reasoning=request.attack_reasoning,
            original_score=request.original_score,
            original_system_prompt=request.original_system_prompt,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
