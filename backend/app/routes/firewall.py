from fastapi import APIRouter
from app.models.schemas import FirewallRequest, FirewallResponse
from app.services.firewall import check_prompt

router = APIRouter()


@router.post("/firewall", response_model=FirewallResponse)
async def firewall(request: FirewallRequest):
    return await check_prompt(request.prompt)
