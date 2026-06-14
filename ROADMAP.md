# Roadmap

This roadmap lists practical improvements that would make the LLM Red-Team Harness stronger for real teams and future hackathon judging.

## Now

- Keep the root GitHub repo clean with only `backend/`, `frontend/`, docs, and project metadata.
- Maintain mock mode for demos without API credits.
- Keep README, SDLC, API docs, and demo script aligned with the actual app.
- Add screenshots to `assets/screenshots/`.

## Next

### Product

- Add downloadable JSON reports for completed runs.
- Add PDF export for safety certificates.
- Add named target profiles for different apps or system prompts.
- Add saved prompt sets for repeatable evaluations.
- Add comparison mode between two system prompts.

### Evaluation

- Add route-level pytest coverage.
- Add deterministic mock fixtures for expected scoring behavior.
- Add Playwright tests for the full `/harness` workflow.
- Add regression tests for known risky prompts.
- Add configurable scoring weights in the UI.

### Security

- Add rate limiting for public deployments.
- Add authentication before sharing with teams.
- Add prompt/output redaction options for sensitive data.
- Add safer logging defaults.
- Add a clear public responsible-use notice in the UI.

### Infrastructure

- Add deployment instructions.
- Add hosted demo configuration.
- Add Dockerfile and docker-compose setup.
- Add database migration strategy for remote Turso usage.
- Add CI artifacts for test results.

## Later

- Multi-model side-by-side benchmark dashboard.
- Team workspaces and shared red-team sessions.
- Scheduled safety regression checks.
- Integration with issue trackers for discovered failures.
- Custom policy packs for organization-specific risk categories.
- Support for uploaded system prompts and policy documents.

## Success Criteria

The project is moving in the right direction when:

- A judge can understand it in under one minute.
- A developer can run it locally in under five minutes.
- The app can complete the full Analyze -> Attack -> Score -> Defend workflow.
- Every risky result gives a clear next action.
- Docs stay accurate as the code changes.
