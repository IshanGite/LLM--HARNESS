import time
import json
# pyrefly: ignore [missing-import]
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # DB write is best-effort — never let it fail the scoring response
    try:
        await db_client.execute("""
            CREATE TABLE IF NOT EXISTS attack_scores (
                id                    INTEGER PRIMARY KEY AUTOINCREMENT,
                original_prompt       TEXT    NOT NULL,
                attack                TEXT    NOT NULL,
                model_response        TEXT    NOT NULL,
                judge_score           REAL    NOT NULL,
                composite_score       REAL    NOT NULL,
                severity              TEXT    NOT NULL,
                violated              INTEGER NOT NULL,
                category              TEXT    NOT NULL,
                reasoning             TEXT    NOT NULL,
                confidence            REAL    NOT NULL,
                refusal_detected      INTEGER NOT NULL,
                keywords_found        TEXT    NOT NULL,
                hallucination_score   REAL    NOT NULL,
                toxicity_score        REAL    NOT NULL,
                bias_score            REAL    NOT NULL,
                deepeval_risk_score   REAL    NOT NULL,
                metrics_available     INTEGER NOT NULL,
                embedding_similarity  REAL    NOT NULL,
                embedding_drifted     INTEGER NOT NULL,
                drift_magnitude       REAL    NOT NULL,
                embedding_available   INTEGER NOT NULL,
                violation_rate        REAL    NOT NULL,
                composite_risk        REAL    NOT NULL,
                evaluation_time_ms    REAL    NOT NULL,
                timestamp             TEXT    NOT NULL
            )
        """)

        for r in result.all_results:
            keywords_found_str = json.dumps(r.enrichment.sensitivity_keywords_found)
            await db_client.execute(
                """
                INSERT INTO attack_scores (
                    original_prompt, attack, model_response, judge_score,
                    composite_score, severity, violated, category, reasoning,
                    confidence, refusal_detected, keywords_found,
                    hallucination_score, toxicity_score, bias_score,
                    deepeval_risk_score, metrics_available, embedding_similarity,
                    embedding_drifted, drift_magnitude, embedding_available,
                    violation_rate, composite_risk, evaluation_time_ms, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    result.original_prompt, r.attack, r.model_response,
                    r.judge_score, r.composite_score, r.severity.value,
                    1 if r.violated else 0, r.category, r.reasoning,
                    r.confidence, 1 if r.enrichment.refusal_detected else 0,
                    keywords_found_str,
                    r.deepeval_result.hallucination_score,
                    r.deepeval_result.toxicity_score,
                    r.deepeval_result.bias_score,
                    r.deepeval_result.risk_score,
                    1 if r.deepeval_result.metrics_available else 0,
                    r.embedding_result.similarity,
                    1 if r.embedding_result.drifted else 0,
                    r.embedding_result.drift_magnitude,
                    1 if r.embedding_result.embedding_available else 0,
                    result.violation_rate, result.composite_risk,
                    result.evaluation_time_ms, result.timestamp,
                ]
            )
    except Exception as db_err:
        print(f"[score] DB write failed (non-fatal): {db_err}")

    return result
