from openai import OpenAI
from app.config import OPENAI_API_KEY
import json

client = OpenAI(
    api_key=OPENAI_API_KEY
)

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

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    result = response.choices[0].message.content

    return json.loads(result)