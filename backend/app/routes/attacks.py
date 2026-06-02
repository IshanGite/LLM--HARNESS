from fastapi import APIRouter

from app.models.schemas import (
    PromptRequest
)

from app.services.analyzer import (
    analyze_prompt
)

from app.services.attacker import (
    generate_attacks
)

router = APIRouter()


@router.post("/attacks")
def create_attacks(
    data: PromptRequest
):

    analysis = analyze_prompt(
        data.prompt
    )

    result = generate_attacks(
        prompt=data.prompt,
        category=analysis["category"],
        intent=analysis["intent"]
    )

    return result