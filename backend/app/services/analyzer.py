import json
import asyncio
import re
# pyrefly: ignore [missing-import]
from app.config import GEMINI_API_KEY, gemini_client, GEMINI_MODEL, gemini_semaphore
from google.genai import types

SYSTEM_PROMPT = """
You are an AI safety classifier.

Return ONLY JSON.

{
    "risk": float,
    "category": string,
    "intent": string
}

Risk must be between 0 and 1.
"""

MAX_RETRIES = 5


def _parse_retry_after(error_str: str) -> float:
    match = re.search(r"'retryDelay':\s*'(\d+)s'", error_str)
    return float(match.group(1)) + 1.0 if match else 30.0


async def analyze_prompt(prompt: str) -> dict:
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("mock") or GEMINI_API_KEY == "TODO_KEY":
        prompt_lower = prompt.lower()
        if "sql" in prompt_lower or "inject" in prompt_lower:
            return {"risk": 0.95, "category": "system_intrusion", "intent": "inject SQL to extract salary database"}
        elif "bypass" in prompt_lower:
            return {"risk": 0.88, "category": "privilege_escalation", "intent": "bypass authentication checks"}
        else:
            return {"risk": 0.85, "category": "information_disclosure", "intent": "retrieve confidential payroll details"}

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        response_mime_type="application/json"
    )

    last_error = None
    delay = 1.0
    async with gemini_semaphore:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = await gemini_client.aio.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config=config
                )
                return json.loads(response.text)
            except Exception as e:
                last_error = e
                error_str = str(e)
                if "429" in error_str or "quota" in error_str.lower():
                    await asyncio.sleep(_parse_retry_after(error_str))
                elif attempt < MAX_RETRIES:
                    await asyncio.sleep(delay)
                    delay *= 2.0

    raise RuntimeError(f"Gemini analyze failed after {MAX_RETRIES} attempts: {last_error}")
