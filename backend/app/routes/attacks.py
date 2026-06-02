from fastapi import APIRouter
from pydantic import BaseModel

from app.services.attacker import generate_attacks

router = APIRouter()


class AttackRequest(BaseModel):
    prompt: str


@router.post("/attacks")
def create_attacks(data: AttackRequest):

    result = generate_attacks(
        data.prompt
    )

    return result