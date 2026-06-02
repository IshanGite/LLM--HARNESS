from pydantic import BaseModel
from typing import List


class PromptRequest(BaseModel):
    prompt: str


class PromptResponse(BaseModel):
    risk: float
    category: str
    intent: str


class AttackResponse(BaseModel):
    original_prompt: str
    category: str
    intent: str
    variants: List[str]