from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")
else:
    gemini_model = None

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL") or "file:local_scores.db"
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN") or ""