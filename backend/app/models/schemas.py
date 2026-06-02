from pydantic import BaseModel
from typing import List
from pydantic import BaseModel


class AttackVariantResponse(BaseModel):
    original_prompt: str
    variants: List[str]
    
    
class PromptRequest(BaseModel):
    prompt: str


class PromptResponse(BaseModel):
    risk: float
    category: str
    intent: str