import json
import uuid
from app.db.turso import client as db
from app.models.schemas import RedTeamResponse, SessionSummary, HistoryResponse

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS redteam_sessions (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id           TEXT    NOT NULL UNIQUE,
    prompt               TEXT    NOT NULL,
    timestamp            TEXT    NOT NULL,
    composite_risk       REAL    NOT NULL,
    violation_rate       REAL    NOT NULL,
    best_score           REAL    NOT NULL,
    best_attack          TEXT    NOT NULL,
    best_technique       TEXT    NOT NULL,
    total_attacks        INTEGER NOT NULL,
    evaluation_time_ms   REAL    NOT NULL,
    safety_grade         TEXT    NOT NULL DEFAULT '',
    severity_distribution TEXT   NOT NULL DEFAULT '{}',
    owasp_breakdown      TEXT    NOT NULL DEFAULT '{}',
    used_system_prompt   INTEGER NOT NULL DEFAULT 0
)
"""


async def _ensure_table() -> None:
    await db.execute(_CREATE_TABLE)


async def save_session(
    response: RedTeamResponse,
    safety_grade: str = "",
    used_system_prompt: bool = False,
) -> str:
    await _ensure_table()
    session_id = str(uuid.uuid4())

    best = response.best_attack
    owasp: dict[str, int] = {}
    for r in response.all_results:
        if r.violated:
            cat = getattr(r, "owasp_category", "LLM01: Prompt Injection")
            owasp[cat] = owasp.get(cat, 0) + 1

    await db.execute(
        """
        INSERT INTO redteam_sessions (
            session_id, prompt, timestamp, composite_risk, violation_rate,
            best_score, best_attack, best_technique, total_attacks,
            evaluation_time_ms, safety_grade, severity_distribution,
            owasp_breakdown, used_system_prompt
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        [
            session_id,
            response.original_prompt,
            response.timestamp,
            response.composite_risk,
            response.violation_rate,
            best.composite_score if best else 0.0,
            best.attack[:300] if best else "",
            best.technique.value if best else "",
            response.total_attacks_tried,
            response.evaluation_time_ms,
            safety_grade,
            json.dumps(response.severity_distribution),
            json.dumps(owasp),
            1 if used_system_prompt else 0,
        ],
    )
    return session_id


async def get_history(limit: int = 20) -> HistoryResponse:
    await _ensure_table()
    result = await db.execute(
        "SELECT * FROM redteam_sessions ORDER BY id DESC LIMIT ?", [limit]
    )
    sessions: list[SessionSummary] = []
    for row in result.rows:
        (id_, session_id, prompt, timestamp, composite_risk, violation_rate,
         best_score, best_attack, best_technique, total_attacks,
         evaluation_time_ms, safety_grade, sev_dist_json,
         owasp_json, used_sp) = row

        sessions.append(SessionSummary(
            session_id=session_id,
            prompt=prompt,
            timestamp=timestamp,
            composite_risk=composite_risk,
            violation_rate=violation_rate,
            best_score=best_score,
            best_attack=best_attack,
            best_technique=best_technique,
            total_attacks=total_attacks,
            safety_grade=safety_grade,
            severity_distribution=json.loads(sev_dist_json or "{}"),
            owasp_breakdown=json.loads(owasp_json or "{}"),
            evaluation_time_ms=evaluation_time_ms,
            used_system_prompt=bool(used_sp),
        ))
    return HistoryResponse(sessions=sessions, total=len(sessions))


async def get_session(session_id: str) -> SessionSummary | None:
    await _ensure_table()
    result = await db.execute(
        "SELECT * FROM redteam_sessions WHERE session_id = ?", [session_id]
    )
    if not result.rows:
        return None
    row = result.rows[0]
    (id_, session_id, prompt, timestamp, composite_risk, violation_rate,
     best_score, best_attack, best_technique, total_attacks,
     evaluation_time_ms, safety_grade, sev_dist_json,
     owasp_json, used_sp) = row
    return SessionSummary(
        session_id=session_id,
        prompt=prompt,
        timestamp=timestamp,
        composite_risk=composite_risk,
        violation_rate=violation_rate,
        best_score=best_score,
        best_attack=best_attack,
        best_technique=best_technique,
        total_attacks=total_attacks,
        safety_grade=safety_grade,
        severity_distribution=json.loads(sev_dist_json or "{}"),
        owasp_breakdown=json.loads(owasp_json or "{}"),
        evaluation_time_ms=evaluation_time_ms,
        used_system_prompt=bool(used_sp),
    )
