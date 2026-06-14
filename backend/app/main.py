import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.analyze import router as analyze_router
from app.routes.attacks import router as attack_router
from app.routes.score import router as score_router
from app.routes.redteam import router as redteam_router
from app.routes.defend import router as defend_router
from app.routes.certificate import router as certificate_router
from app.routes.firewall import router as firewall_router
from app.routes.history import router as history_router

app = FastAPI(title="AI Safety Gateway")

# Configure CORS origins
allowed_origins = [
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:3001", "http://127.0.0.1:3001",
    "http://localhost:3002", "http://127.0.0.1:3002",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    if env_origins.strip() == "*":
        allowed_origins = ["*"]
    else:
        allowed_origins.extend([origin.strip() for origin in env_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(attack_router)
app.include_router(score_router)
app.include_router(redteam_router)
app.include_router(defend_router)
app.include_router(certificate_router)
app.include_router(firewall_router)
app.include_router(history_router)