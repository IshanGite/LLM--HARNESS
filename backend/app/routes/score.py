import time
import json
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ScoringRequest,
    ScoringResponse
)
from app.services.scorer import (
    score_attacks
)
from app.db.turso import client as db_client

router = APIRouter()


@router.post(
    "/score",
    response_model=ScoringResponse
)
async def create_score(request: ScoringRequest):
    _start_time = time.time()
    if not request.attacks:
        raise HTTPException(status_code=422, detail="attacks list is empty")

    try:
        result = await score_attacks(request.original_prompt, request.attacks)
        
        # Create table SQL
        await db_client.execute("""
            CREATE TABLE IF NOT EXISTS attack_scores (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                original_prompt TEXT NOT NULL,
                attack         TEXT NOT NULL,
                model_response TEXT NOT NULL,
                judge_score    REAL NOT NULL,
                composite_score REAL NOT NULL,
                severity       TEXT NOT NULL,
                violated       INTEGER NOT NULL,
                category       TEXT NOT NULL,
                reasoning      TEXT NOT NULL,
                confidence     REAL NOT NULL,
                refusal_detected INTEGER NOT NULL,
                keywords_found TEXT NOT NULL,
                violation_rate REAL NOT NULL,
                composite_risk REAL NOT NULL,
                evaluation_time_ms REAL NOT NULL,
                timestamp      TEXT NOT NULL
            )
        """)
        
        # Insert one row per AttackResult in result.all_results
        for r in result.all_results:
            keywords_found_str = json.dumps(r.enrichment.sensitivity_keywords_found)
            violated_int = 1 if r.violated else 0
            refusal_detected_int = 1 if r.enrichment.refusal_detected else 0
            
            await db_client.execute(
                """
                INSERT INTO attack_scores (
                    original_prompt,
                    attack,
                    model_response,
                    judge_score,
                    composite_score,
                    severity,
                    violated,
                    category,
                    reasoning,
                    confidence,
                    refusal_detected,
                    keywords_found,
                    violation_rate,
                    composite_risk,
                    evaluation_time_ms,
                    timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    result.original_prompt,
                    r.attack,
                    r.model_response,
                    r.judge_score,
                    r.composite_score,
                    r.severity.value,
                    violated_int,
                    r.category,
                    r.reasoning,
                    r.confidence,
                    refusal_detected_int,
                    keywords_found_str,
                    result.violation_rate,
                    result.composite_risk,
                    result.evaluation_time_ms,
                    result.timestamp
                ]
            )
            
        _route_duration = time.time() - _start_time
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
