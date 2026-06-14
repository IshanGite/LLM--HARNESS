# LLM Red-Team Harness

An interactive red-team harness for testing how an LLM responds to risky prompts, adversarial variants, and prompt-injection attempts. The app analyzes a prompt, generates attack variants, scores model behavior, suggests defensive prompt hardening, and can produce a safety-style report for the tested session.

The project is built with a FastAPI backend and a Next.js frontend. It uses OpenAI models for classification, attack generation, target responses, judging, defense synthesis, and embeddings. If no valid API key is configured, the backend falls back to a local mock mode so the app can still be opened and tested without crashing.

## Features

- Prompt risk analysis with category, intent, and risk score
- Adversarial attack generation from the analyzed prompt
- Multi-signal scoring across judge score, refusal quality, keyword signals, embeddings, and heuristic evaluation
- Prompt-injection firewall checks
- Iterative red-team mode with streaming progress events
- Multi-turn attack simulation
- Defense synthesis that proposes a hardened system prompt
- Session history backed by local SQLite/libSQL or Turso
- Safety certificate view with grade, recommendations, and OWASP-style breakdown
- Modern Next.js UI with a landing page and an app workspace at `/harness`

## Project Docs

- [Software Development Life Cycle](SDLC.md)

## Workflow

1. **Analyze**

   Enter a user prompt. The backend classifies the prompt's risk, intent, and category. Examples of categories include system intrusion, harmful content, credential theft, information disclosure, prompt injection, and other safety-relevant classes.

2. **Attack**

   The harness turns the analyzed prompt into adversarial variants. These variants preserve the original goal while probing different routes such as indirect phrasing, authority framing, roleplay, obfuscation, context stuffing, and other jailbreak-style techniques.

3. **Score**

   Each attack is sent through the scoring pipeline. The backend collects the model response, judges whether the attack succeeded, computes a composite score, assigns severity, and returns the strongest attack.

4. **Defend**

   For a high-risk or successful attack, the defense synthesis step proposes a hardened system prompt and re-tests the model to estimate whether the defense improved safety.

5. **Review**

   Results can be reviewed in the UI through summaries, detailed attack cards, history, firewall checks, and certificate/report views.

## Folder Structure

```text
LLM--HARNESS/
  backend/
    app/
      main.py                 FastAPI app entrypoint and route registration
      config.py               OpenAI, database, model, and concurrency config
      models/
        schemas.py            Pydantic request and response models
      routes/
        analyze.py            POST /analyze
        attacks.py            POST /attacks
        score.py              POST /score
        redteam.py            POST /redteam, /redteam/stream, /redteam/multiturn
        defend.py             POST /defend
        certificate.py        POST /certificate
        firewall.py           POST /firewall
        history.py            GET /history, /history/{session_id}
      services/
        analyzer.py           Prompt risk classification
        attacker.py           Attack variant generation
        scorer.py             Target response, judging, and composite scoring
        mock_llm.py           Local fallback behavior without a valid API key
        defense_synthesizer.py
        embedding_scorer.py
        enhanced_scorer.py
        multiturn_attacker.py
        taxonomy_attacker.py
        history.py
        firewall.py
      db/
        turso.py              Local SQLite/libSQL and Turso connection helpers
      tests/
        test_scorer.py        Scoring pipeline smoke/integration test
    requirements.txt

  frontend/
    app/
      page.tsx                Landing page
      harness/page.tsx        Main interactive harness UI
      layout.tsx
      globals.css
    components/               UI, result, defense, history, and visual components
    lib/
      api.ts                  Frontend API client
      utils.ts
    package.json
    next.config.ts            Local /api rewrite to the backend

  .gitignore
  README.md
```

## Requirements

- Python 3.11 or newer
- Node.js 18 or newer
- npm
- An OpenAI API key for real model calls

The app can run without a real key in mock mode, but real OpenAI scoring and generation require a valid `OPENAI_API_KEY`.

## Backend Setup

Open a terminal in the project root:

```powershell
cd D:\LLM_HARNESS
```

Create and activate a Python virtual environment:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Create `backend/.env`:

```env
OPENAI_API_KEY=sk-proj-your-real-key-here
OPENAI_MODEL=gpt-5.5
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_BENCHMARK_MODELS=gpt-5.5
OPENAI_SEMAPHORE_SIZE=3

# Optional. Leave blank to use local_scores.db.
TURSO_DATABASE_URL=file:local_scores.db
TURSO_AUTH_TOKEN=
```

Start the backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Backend URL:

```text
http://localhost:8000
```

FastAPI docs:

```text
http://localhost:8000/docs
```

## Frontend Setup

Open a second terminal in the project root:

```powershell
cd D:\LLM_HARNESS\frontend
```

Install dependencies:

```powershell
npm install
```

Start the frontend:

```powershell
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

Main app workspace:

```text
http://localhost:3000/harness
```

## Running The Full App

Use two terminals:

```powershell
# Terminal 1: backend
cd D:\LLM_HARNESS\backend
.\.venv\Scripts\Activate.ps1
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

```powershell
# Terminal 2: frontend
cd D:\LLM_HARNESS\frontend
npm run dev
```

Then open:

```text
http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/analyze` | Classify prompt intent, category, and risk |
| `POST` | `/attacks` | Generate adversarial variants |
| `POST` | `/score` | Score generated attacks against the target model |
| `POST` | `/redteam` | Run the enhanced red-team pipeline |
| `POST` | `/redteam/stream` | Stream red-team progress events |
| `POST` | `/redteam/multiturn` | Run multi-turn attack simulations |
| `POST` | `/defend` | Generate and test a hardened system prompt |
| `POST` | `/certificate` | Build a safety certificate from results |
| `POST` | `/firewall` | Check whether a prompt should be allowed, warned, or blocked |
| `GET` | `/history` | List stored sessions |
| `GET` | `/history/{session_id}` | Fetch a stored session summary |

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes for real OpenAI calls | OpenAI Platform API key. If missing or invalid-looking, mock mode is used. |
| `OPENAI_MODEL` | No | Main model used for generation and judging. Defaults to `gpt-5.5`. |
| `OPENAI_EMBEDDING_MODEL` | No | Embedding model. Defaults to `text-embedding-3-small`. |
| `OPENAI_BENCHMARK_MODELS` | No | Comma-separated models for benchmark probes. Defaults to `gpt-5.5`. |
| `OPENAI_SEMAPHORE_SIZE` | No | Max concurrent OpenAI calls. Defaults to `3`. |
| `TURSO_DATABASE_URL` | No | Turso/libSQL URL. Defaults to local `file:local_scores.db`. |
| `TURSO_AUTH_TOKEN` | No | Turso auth token for remote database usage. |
| `NEXT_PUBLIC_API_URL` | No | Frontend override for backend URL. Defaults to `http://localhost:8000`. |

## Mock Mode

Mock mode is enabled when `OPENAI_API_KEY` is missing, set to `TODO_KEY`, starts with `mock`, or is too short to look like a real OpenAI key.

Mock mode is useful for:

- opening the UI before adding billing/API credentials
- demoing the workflow without spending credits
- testing the frontend/backend connection

For real OpenAI calls, add a valid key to `backend/.env` and restart the backend.

## Testing

Run the backend scoring smoke test:

```powershell
cd D:\LLM_HARNESS\backend
.\.venv\Scripts\Activate.ps1
python -m app.tests.test_scorer
```

Build the frontend:

```powershell
cd D:\LLM_HARNESS\frontend
npm run build
```

## Troubleshooting

### The app opens but API calls fail

Make sure the backend is running on port `8000`:

```text
http://localhost:8000/docs
```

Also make sure the frontend is running on port `3000`.

### I see invalid API key errors

The promo code or credit code is not the API key. Create an API key from the OpenAI Platform API keys page, paste it into `backend/.env`, and restart the backend.

### The UI still shows old results

Click Analyze again after changing the prompt. If needed, restart both servers:

```powershell
Ctrl+C
npm run dev
```

```powershell
Ctrl+C
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### Port 3000 is busy

Next.js may start on another port such as `3001`. The backend already allows localhost ports `3000`, `3001`, and `3002`.

## Notes

- Do not commit `backend/.env`; it contains secrets.
- Local database files such as `local_scores.db` are ignored.
- Virtual environments, `node_modules`, `.next`, Python bytecode, and local cache folders are ignored.
- `openai-ready-project/` is a local-only helper copy and is ignored by Git. The GitHub repo should stay focused on the root `backend/` and `frontend/` app.
