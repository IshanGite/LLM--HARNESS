import json
# pyrefly: ignore [missing-import]
import google.generativeai as genai
from app.config import gemini_model

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

def analyze_prompt(prompt: str):
    generation_config = genai.GenerationConfig(
        response_mime_type="application/json"
    )
    full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"
    
    response = gemini_model.generate_content(
        full_prompt,
        generation_config=generation_config
    )

    result = response.text

    return json.loads(result)