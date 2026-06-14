# Software Development Life Cycle

This document defines the SDLC for the LLM Red-Team Harness. It describes how the project should be planned, built, tested, secured, released, and maintained.

## 1. Project Purpose

The LLM Red-Team Harness is a safety evaluation tool for large language model applications. It helps teams test prompts, generate adversarial variants, score model behavior, synthesize defenses, and review historical safety results.

The system is intentionally split into:

- `backend/`: FastAPI services for analysis, attack generation, scoring, defense synthesis, history, and certificates
- `frontend/`: Next.js interface for running the red-team workflow
- OpenAI integration for real model calls
- Mock mode for local demos and development without a valid API key

## 2. SDLC Overview

The project follows an iterative SDLC:

```text
Plan -> Design -> Implement -> Test -> Review -> Release -> Monitor -> Improve
```

Each iteration should produce a small, reviewable improvement that can be tested locally before being pushed.

## 3. Phase 1: Planning

### Goals

- Identify the feature, fix, or safety improvement.
- Define the user workflow affected by the change.
- Decide whether the change touches frontend, backend, model behavior, database behavior, or all of them.

### Planning Checklist

- What user problem does this solve?
- Which pipeline phase is affected?
  - Analyze
  - Attack
  - Score
  - Defend
  - Certificate
  - Firewall
  - History
- Does this change require OpenAI API calls?
- Does this change need mock-mode behavior?
- Does this change affect stored session history?
- What could fail or regress?

### Output

- Clear implementation scope
- Expected behavior
- Test plan
- Rollback plan for risky changes

## 4. Phase 2: System Design

### Architecture

```text
User
  |
  v
Next.js Frontend
  |
  v
FastAPI Backend
  |
  +--> OpenAI API
  +--> Mock LLM fallback
  +--> Local SQLite or Turso history store
```

### Design Rules

- Keep frontend state and backend response models aligned.
- Keep API contracts defined in `backend/app/models/schemas.py`.
- Keep route handlers thin and business logic inside `backend/app/services/`.
- Keep secrets only in `.env` files, never in source code.
- Keep mock mode behavior close to real response shapes.
- Prefer small service functions over large route handlers.

### API Design

Primary routes:

| Endpoint | Purpose |
| --- | --- |
| `POST /analyze` | Classify prompt risk, category, and intent |
| `POST /attacks` | Generate adversarial variants |
| `POST /score` | Score attacks and return the strongest result |
| `POST /redteam` | Run enhanced red-team evaluation |
| `POST /redteam/stream` | Stream red-team progress to the UI |
| `POST /redteam/multiturn` | Run multi-turn attack simulation |
| `POST /defend` | Generate and test a hardened prompt |
| `POST /certificate` | Produce safety certificate data |
| `POST /firewall` | Check whether a prompt should be allowed, warned, or blocked |
| `GET /history` | List previous sessions |
| `GET /history/{session_id}` | Fetch one previous session |

## 5. Phase 3: Implementation

### Backend Standards

- Use FastAPI route files in `backend/app/routes/`.
- Use Pydantic schemas for request and response validation.
- Put OpenAI calls behind reusable service functions.
- Handle OpenAI errors clearly:
  - invalid API key
  - missing model access
  - model not found
  - unsupported parameters
- Keep fallback mock behavior available for development.
- Do not commit local databases, `.env`, virtual environments, or cache files.

### Frontend Standards

- Keep API calls in `frontend/lib/api.ts`.
- Keep reusable UI in `frontend/components/`.
- Keep the main app workflow in `frontend/app/harness/page.tsx`.
- Use stable loading, error, and empty states for every long-running API call.
- Avoid frontend-only assumptions about backend response shapes.

### Model Integration Standards

- Read model names from environment variables.
- Default model: `OPENAI_MODEL`.
- Default embedding model: `OPENAI_EMBEDDING_MODEL`.
- Use mock mode when no valid key exists.
- Avoid logging API keys, prompts containing secrets, or raw credentials.

## 6. Phase 4: Testing

Testing should cover both technical correctness and safety behavior.

### Backend Tests

Run:

```powershell
cd D:\LLM_HARNESS\backend
.\.venv\Scripts\Activate.ps1
python -m app.tests.test_scorer
```

Backend validation checklist:

- `/analyze` returns risk, category, and intent.
- `/attacks` returns multiple attack variants.
- `/score` returns sorted results and a winning attack.
- Mock mode works without a valid OpenAI key.
- Invalid OpenAI keys fail with a clear message.
- History writes do not break if using local storage.

### Frontend Tests

Run:

```powershell
cd D:\LLM_HARNESS\frontend
npm run build
```

Frontend validation checklist:

- Landing page renders.
- `/harness` renders.
- Analyze, Attack, Score, Defend, and Certificate phases are reachable.
- Firewall and History sidebar views render.
- Errors are visible and understandable.
- Long-running requests do not silently fail.

### Manual End-to-End Test

Start backend:

```powershell
cd D:\LLM_HARNESS\backend
.\.venv\Scripts\Activate.ps1
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Start frontend:

```powershell
cd D:\LLM_HARNESS\frontend
npm run dev
```

Open:

```text
http://localhost:3000/harness
```

Manual test flow:

1. Enter a prompt.
2. Click Analyze.
3. Generate attacks.
4. Score attacks.
5. Open the strongest result.
6. Generate a defense.
7. Create a certificate.
8. Confirm the session appears in history.

## 7. Phase 5: Security Review

Because this is a red-team and model safety tool, security review is required for every meaningful backend or model-pipeline change.

### Secret Handling

- Never commit `.env`.
- Never print `OPENAI_API_KEY`.
- Never paste real API keys into screenshots, README files, examples, or test fixtures.
- Use placeholder values in documentation.

### Prompt and Output Safety

- Treat user prompts and model outputs as untrusted input.
- Avoid rendering raw HTML from model output.
- Avoid storing unnecessary sensitive data.
- Keep history storage limited to the data needed for review.

### Abuse Controls

- Keep request validation on attack counts and prompt lengths.
- Keep concurrency controlled with `OPENAI_SEMAPHORE_SIZE`.
- Prefer clear refusal and safety scoring logic over hidden behavior.
- Add rate limiting before public deployment.

### Dependency Review

- Review Python and npm dependency updates before merging.
- Do not add large new libraries for small tasks.
- Run frontend build after dependency changes.
- Run backend smoke tests after service changes.

## 8. Phase 6: Code Review

Every change should be reviewed against:

- Correctness
- Safety impact
- API contract stability
- UI behavior
- Error handling
- Test coverage
- Secret leakage risk
- Whether mock mode still works

### Review Questions

- Does this change make the model pipeline safer or clearer?
- Can this fail gracefully?
- Are response schemas still compatible with the frontend?
- Are API errors actionable?
- Did generated files accidentally get staged?
- Does this introduce a data privacy risk?

## 9. Phase 7: Release

### Release Checklist

- Backend smoke test passes.
- Frontend build passes.
- `.env` and local database files are not staged.
- README and SDLC are updated if setup or workflow changed.
- GitHub repository contains only the clean app structure:

```text
LLM--HARNESS/
  backend/
  frontend/
  .gitignore
  README.md
  SDLC.md
```

### Git Workflow

Recommended commit style:

```text
Add prompt firewall scoring
Fix OpenAI invalid-key fallback
Update harness hero typography
Document SDLC workflow
```

Before pushing:

```powershell
git status --short
git diff --cached --name-status
```

Push:

```powershell
git push origin main
```

## 10. Phase 8: Monitoring and Maintenance

### Local Monitoring

During development, watch:

- Backend terminal logs
- Frontend terminal logs
- Browser console
- FastAPI `/docs`
- Network errors from frontend requests

### App Health Signals

- API latency for scoring and red-team runs
- OpenAI authentication and model-access errors
- Failed history writes
- Frontend failed fetches
- Empty or malformed model responses
- Unexpected mock-mode activation

### Maintenance Tasks

- Keep dependencies updated deliberately.
- Re-test OpenAI model compatibility after model changes.
- Keep mock mode aligned with real response schemas.
- Keep `.gitignore` updated when new local artifacts appear.
- Periodically clean tracked generated files if any were committed accidentally.

## 11. Risk Management

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Invalid API key | App cannot use real OpenAI calls | Clear error messages and mock mode |
| Missing model access | Model calls fail | Environment-driven model names |
| Long-running score requests | Frontend timeout | Direct backend calls for slow routes |
| Prompt/output data exposure | Privacy issue | Do not log secrets; limit stored data |
| Generated files committed | Messy repo and possible leaks | Strong `.gitignore` and staged diff review |
| Frontend/backend schema drift | Runtime UI errors | Pydantic schemas and TypeScript API types |
| Unsafe generated attacks | Abuse potential | Keep tool scoped to defensive testing and scoring |

## 12. Definition of Done

A change is done when:

- The intended behavior works locally.
- Backend changes have been smoke-tested.
- Frontend changes build successfully.
- Errors are understandable to the user.
- Mock mode still works when relevant.
- No secrets or generated artifacts are staged.
- Documentation is updated if setup, workflow, routes, or environment variables changed.
- The commit message clearly describes the change.

## 13. Future Improvements

- Add automated pytest coverage for each route.
- Add Playwright tests for the main `/harness` workflow.
- Add CI checks for backend tests and frontend builds.
- Add rate limiting for public deployments.
- Add role-based access if deployed for teams.
- Add exportable JSON reports for red-team sessions.
- Add configurable target model/system prompt profiles.
