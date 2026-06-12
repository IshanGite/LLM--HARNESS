import asyncio
import re
import time
from app.models.schemas import FirewallResponse
from app.services.analyzer import analyze_prompt

# Regex signatures for known injection and jailbreak patterns.
# Each tuple: (compiled_pattern, technique_label)
_SIGNATURES: list[tuple[re.Pattern, str]] = [
    (re.compile(r"(?i)ignore\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|prompts?|rules?|guidelines?|constraints?|context)", re.I),
     "instruction_override"),
    (re.compile(r"(?i)(pretend|act|imagine|behave|respond)\s+(as if|like|as though|you (are|have|have no))\s+.{0,60}(no restrict|unrestrict|no limit|no rule|no filter|no constraint|jailbreak|DAN)", re.I),
     "persona_jailbreak"),
    (re.compile(r"(?i)(developer\s+mode|jailbreak\s+mode|unrestricted\s+mode|god\s+mode|DAN\s+mode|sudo\s+mode)", re.I),
     "mode_switch"),
    (re.compile(r"(?i)(your\s+(true|real|hidden|actual|uncensored|original)\s+(self|personality|identity|form|nature))", re.I),
     "identity_manipulation"),
    (re.compile(r"(?i)(repeat|print|output|reveal|show|tell me|write out)\s+.{0,40}(system prompt|initial prompt|original instruction|your instruction)", re.I),
     "prompt_leakage"),
    (re.compile(r"(?i)(you\s+are\s+now|from\s+now\s+on\s+you\s+(are|will|must)|you\s+will\s+act\s+as)\s+.{0,60}(without\s+(restriction|limit|filter|rule)|unrestrict|no\s+filter)", re.I),
     "role_reassignment"),
    (re.compile(r"(?i)(for\s+)?(educational|research|academic|scientific|hypothetical|fictional)\s+(purpose|reason|context|scenario|exercise|case)", re.I),
     "false_authority"),
    (re.compile(r"(?i)(base64|hex.{0,10}encoded|rot13|caesar.{0,10}cipher|leetspeak|l33t|morse\s+code)\s+.{0,40}(decode|translate|interpret|convert)", re.I),
     "obfuscation_encoding"),
    (re.compile(r"(?i)\]\s*\n+\s*\[|\}\s*\n+\s*\{|<\s*/\s*system\s*>|<\s*system\s*>", re.I),
     "context_escape"),
    (re.compile(r"(?i)(grandmother|bedtime story|my (friend|colleague|boss|professor)|in a novel|in my story|for a game)\s+.{0,80}(explain|tell|show|describe|provide)\s+.{0,80}(how to|steps to|way to)", re.I),
     "social_engineering"),
    (re.compile(r"(?i)(your\s+(other|second|alternate|shadow)\s+(personality|self|mode|voice)|split\s+personality|two\s+sides)", re.I),
     "persona_split"),
    (re.compile(r"(?i)(do\s+anything\s+now|DAN|STAN|JAILBREAK|override\s+(safety|filter|restriction|guideline))", re.I),
     "explicit_jailbreak"),
]


def _fast_scan(prompt: str) -> list[str]:
    detected: list[str] = []
    for pattern, label in _SIGNATURES:
        if pattern.search(prompt) and label not in detected:
            detected.append(label)
    return detected


async def check_prompt(prompt: str) -> FirewallResponse:
    start = time.monotonic()

    # Run regex scan (sync) and analyzer (async) concurrently
    scan_result, analysis = await asyncio.gather(
        asyncio.to_thread(_fast_scan, prompt),
        analyze_prompt(prompt),
        return_exceptions=True,
    )

    detected: list[str] = scan_result if isinstance(scan_result, list) else []
    risk_score: float = 0.0
    if isinstance(analysis, dict):
        risk_score = float(analysis.get("risk", 0.0))

    # Decision
    if risk_score >= 0.85 or len(detected) >= 2:
        action = "block"
    elif risk_score >= 0.50 or len(detected) >= 1:
        action = "warn"
    else:
        action = "allow"

    blocked = action == "block"
    safe = action == "allow"

    reasons: list[str] = []
    if risk_score >= 0.85:
        reasons.append(f"High risk score ({risk_score:.2f}) — AI classifier flagged this as dangerous")
    elif risk_score >= 0.50:
        reasons.append(f"Elevated risk score ({risk_score:.2f}) — prompt warrants review")
    for tech in detected:
        reasons.append(f"Detected pattern: {tech.replace('_', ' ')}")
    if not reasons:
        reasons.append("No threats detected")

    return FirewallResponse(
        safe=safe,
        blocked=blocked,
        risk_score=round(risk_score, 4),
        action=action,
        reasons=reasons,
        detected_techniques=detected,
        evaluation_ms=round((time.monotonic() - start) * 1000, 2),
    )
