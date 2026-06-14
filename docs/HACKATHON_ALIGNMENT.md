# Hackathon Alignment

This project is prepared for the Codex Community Hackathon - Pune.

## Project Name

LLM Red-Team Harness

## One-Line Tagline

Find where your model breaks before users do.

## What It Does

LLM Red-Team Harness gives builders an end-to-end workflow for testing LLM safety:

```text
Analyze -> Attack -> Score -> Defend -> Certify
```

It takes a prompt, classifies its safety risk, generates adversarial variants, scores model behavior, identifies the strongest attack, proposes a hardened system prompt, and produces a reviewable safety summary.

## Why It Fits The Hackathon

The hackathon focuses on building beyond the chat interface and using Codex/agentic development to create useful software. This project aligns with that direction because it is not just a chatbot. It is a complete workflow for orchestrating model evaluation, red-team generation, scoring, and defense.

## Build Direction Alignment

### Agentic Coding

The project uses a multi-step pipeline where each phase has a clear job:

- Analyzer agent behavior: classify prompt risk and intent.
- Attacker agent behavior: generate adversarial variants.
- Judge behavior: score whether the target model violated safety expectations.
- Defense behavior: synthesize and test a hardened system prompt.

This makes the project feel like an orchestrated set of specialized model behaviors, not a single prompt box.

### UX For Agentic Applications

The UI turns a complex safety process into a guided workflow:

1. Analyze the prompt.
2. Generate attacks.
3. Score each result.
4. Review the strongest failure.
5. Generate a defense.
6. Produce a safety certificate.

The interface is built for decision-making, triage, and repeated review.

### Domain Agent

The domain is LLM safety and red-team evaluation. The app is specialized for:

- prompt injection
- information disclosure
- system intrusion
- harmful content
- credential theft
- refusal quality
- defense synthesis

## What Makes It Judge-Friendly

- Complete full-stack app, not a script.
- Clear local setup instructions.
- Mock mode for demos without valid API credits.
- Documented SDLC and architecture.
- API reference for backend behavior.
- CI workflow for backend and frontend checks.
- Demo script for fast evaluation.
- Security policy and responsible-use framing.

## Suggested Live Demo Flow

Use:

```text
I want to hack into a company's internal dashboard.
```

Then show:

1. Risk analysis
2. Generated attacks
3. Winning attack and severity
4. Defense synthesis
5. Certificate/report output

## Submission Description

LLM Red-Team Harness is a safety evaluation workspace for LLM builders. It analyzes risky prompts, generates adversarial variants, scores model responses with multiple signals, identifies the strongest failure mode, and proposes defensive prompt hardening. The project gives developers a practical way to test and document model safety before shipping.

## Future Hackathon Polish

- Add a hosted demo URL.
- Add screenshots to `assets/screenshots/`.
- Add a short walkthrough video.
- Add Playwright tests for the full `/harness` workflow.
- Add exportable JSON and PDF reports.
