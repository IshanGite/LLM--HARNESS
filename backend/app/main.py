from fastapi import FastAPI

from app.routes.analyze import router as analyze_router
from app.routes.attacks import router as attack_router

app = FastAPI(
    title="AI Safety Gateway"
)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "AI Safety Gateway is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }

app.include_router(analyze_router)
app.include_router(attack_router)