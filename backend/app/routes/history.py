from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import SessionSummary, HistoryResponse
from app.services.history import get_history, get_session

router = APIRouter()


@router.get("/history", response_model=HistoryResponse)
async def history(limit: int = Query(default=20, ge=1, le=100)):
    return await get_history(limit=limit)


@router.get("/history/{session_id}", response_model=SessionSummary)
async def history_session(session_id: str):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
