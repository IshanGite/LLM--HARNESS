# Security Policy

LLM Red-Team Harness is a defensive testing tool. It is intended to help builders evaluate and harden LLM applications before deployment.

## Supported Use

Use this project to:

- test your own LLM applications
- evaluate prompt-injection resilience
- identify unsafe model responses
- improve system prompts and safeguards
- document safety posture before release

Do not use this project to attack systems, bypass access controls, steal credentials, or target third-party services without permission.

## Secret Handling

Never commit secrets.

Ignored by default:

- `.env`
- `backend/.env`
- local database files
- virtual environments
- build output
- caches

Use `.env.example` as the public template and keep real values only in local `.env` files.

## API Keys

OpenAI API keys should be stored in:

```text
backend/.env
```

Example:

```env
OPENAI_API_KEY=sk-proj-your-real-key-here
```

Do not paste real API keys into:

- README files
- screenshots
- GitHub issues
- pull requests
- terminal logs
- demo videos

## Data Handling

Prompts and outputs may contain sensitive information. Treat all user-provided prompts and model responses as untrusted data.

Recommended practices:

- Avoid testing with real credentials.
- Avoid testing with private customer data.
- Redact sensitive data before sharing results.
- Keep local database files out of Git.
- Delete local history if it contains sensitive prompts.

## Responsible Disclosure

If you find a security issue in this project:

1. Do not publish exploit details publicly.
2. Open a private report or contact the repository owner.
3. Include reproduction steps, expected behavior, actual behavior, and impact.

## Deployment Hardening

Before deploying publicly:

- Add authentication.
- Add rate limiting.
- Restrict CORS origins.
- Review logging behavior.
- Store secrets in a managed secret store.
- Use HTTPS.
- Add monitoring for failed requests and abuse patterns.
- Avoid exposing debug routes or verbose stack traces.

## Model Safety Notes

This app may generate adversarial prompts as part of defensive testing. Keep usage scoped to authorized systems and controlled demos.

For public demos, prefer mock mode or carefully chosen examples that demonstrate the workflow without enabling misuse.
