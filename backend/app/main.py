from fastapi import FastAPI

from app.routes.analyze import router as analyze_router
from app.routes.attacks import router as attack_router
from app.routes.score import router as score_router

app = FastAPI(
    title="AI Safety Gateway"
)

app.include_router(analyze_router)
app.include_router(attack_router)
app.include_router(score_router)