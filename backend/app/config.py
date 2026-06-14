import asyncio
import os
from openai import AsyncOpenAI
# pyrefly: ignore [missing-import]
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(override=True)

# OpenAI Config
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY or "TODO_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.5")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

OPENAI_SEMAPHORE_SIZE = int(os.getenv("OPENAI_SEMAPHORE_SIZE", "3"))
openai_semaphore = asyncio.Semaphore(OPENAI_SEMAPHORE_SIZE)

BENCHMARK_MODELS = [
    model.strip()
    for model in os.getenv("OPENAI_BENCHMARK_MODELS", "gpt-5.5").split(",")
    if model.strip()
]

# Gemini Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    gemini_client = None

GEMINI_MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "gemini-embedding-001"

GEMINI_SEMAPHORE_SIZE = int(os.getenv("GEMINI_SEMAPHORE_SIZE", "3"))
gemini_semaphore = asyncio.Semaphore(GEMINI_SEMAPHORE_SIZE)


def is_openai_mock_mode() -> bool:
    return (
        not OPENAI_API_KEY
        or OPENAI_API_KEY.startswith("mock")
        or OPENAI_API_KEY == "TODO_KEY"
        or len(OPENAI_API_KEY) < 40
    )
