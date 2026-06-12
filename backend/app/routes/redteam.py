import asyncio
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    RedTeamRequest, RedTeamResponse, EnhancedAttackResult,
    MultiTurnRequest, MultiTurnResponse,
)
from app.services.iterative_engine import run_redteam
from app.services.multiturn_attacker import run_multiturn_attack
from app.services.analyzer import analyze_prompt

router = APIRouter(prefix="/redteam", tags=["redteam"])


@router.post("", response_model=RedTeamResponse)
async def redteam(request: RedTeamRequest):
    try:
        return await run_redteam(
            prompt=request.prompt,
            max_rounds=request.max_rounds,
            attacks_per_technique=request.attacks_per_technique,
            success_rate_runs=request.success_rate_runs,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def redteam_stream(request: RedTeamRequest):
    """
    SSE endpoint. Each event is a JSON line prefixed with 'data: '.

    Event types:
      {"type": "attack_result",          ...EnhancedAttackResult fields...}
      {"type": "round_complete",          "round": int, "best_score": float, "critical_found": bool}
      {"type": "post_processing_complete"}
      {"type": "complete",               ...RedTeamResponse fields...}
      {"type": "error",                  "detail": str}
    """
    queue: asyncio.Queue = asyncio.Queue()

    async def on_result(result: EnhancedAttackResult):
        payload = {"type": "attack_result"}
        payload.update(result.model_dump())
        await queue.put(payload)

    async def on_event(event: dict):
        await queue.put(event)

    async def run_pipeline():
        try:
            final = await run_redteam(
                prompt=request.prompt,
                max_rounds=request.max_rounds,
                attacks_per_technique=request.attacks_per_technique,
                success_rate_runs=request.success_rate_runs,
                on_result=on_result,
                on_event=on_event,
            )
            payload = {"type": "complete"}
            payload.update(final.model_dump())
            await queue.put(payload)
        except Exception as e:
            await queue.put({"type": "error", "detail": str(e)})
        finally:
            await queue.put(None)  # sentinel

    async def event_generator():
        task = asyncio.create_task(run_pipeline())
        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield f"data: {json.dumps(item, default=str)}\n\n"
        finally:
            task.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/multiturn", response_model=MultiTurnResponse)
async def multiturn(request: MultiTurnRequest):
    try:
        analysis = await analyze_prompt(request.prompt)
        return await run_multiturn_attack(
            prompt=request.prompt,
            category=analysis["category"],
            intent=analysis["intent"],
            num_turns=request.num_turns,
            num_scenarios=request.num_scenarios,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
