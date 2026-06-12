import asyncio
import statistics
import time
from datetime import datetime
from typing import Callable, Awaitable

from app.models.schemas import (
    SeverityBadge,
    EnhancedAttackResult,
    IterativeRound,
    SuccessRateResult,
    ModelProbeResult,
    RedTeamResponse,
)
from app.services.analyzer import analyze_prompt
from app.services.taxonomy_attacker import generate_taxonomy_attacks, generate_evolved_attacks
from app.services.enhanced_scorer import (
    score_enhanced_attack,
    score_attack_n_times,
    benchmark_models,
    multi_judge_response,
    _enhanced_composite,
)


async def _score_batch(
    attacks,
    round_number: int,
    on_result: Callable[[EnhancedAttackResult], Awaitable[None]] | None,
    target_system_prompt: str = "",
) -> list[EnhancedAttackResult]:
    async def _score_and_notify(ta):
        result = await score_enhanced_attack(
            ta.attack, ta.technique, round_number,
            target_system_prompt=target_system_prompt,
        )
        if on_result:
            await on_result(result)
        return result

    results = await asyncio.gather(
        *[_score_and_notify(ta) for ta in attacks],
        return_exceptions=True,
    )
    return [r for r in results if isinstance(r, EnhancedAttackResult)]


async def run_redteam(
    prompt: str,
    max_rounds: int = 3,
    attacks_per_technique: int = 3,
    success_rate_runs: int = 3,
    target_system_prompt: str = "",
    on_result: Callable[[EnhancedAttackResult], Awaitable[None]] | None = None,
    on_event: Callable[[dict], Awaitable[None]] | None = None,
) -> RedTeamResponse:
    start = time.monotonic()

    analysis = await analyze_prompt(prompt)
    category = analysis["category"]
    intent = analysis["intent"]

    all_results: list[EnhancedAttackResult] = []
    rounds: list[IterativeRound] = []

    # ── Round 0: taxonomy attacks ──────────────────────────────────────────
    taxonomy_attacks = await generate_taxonomy_attacks(
        prompt, category, intent, variants_per_technique=attacks_per_technique
    )
    round_results = await _score_batch(
        taxonomy_attacks, round_number=0,
        on_result=on_result, target_system_prompt=target_system_prompt,
    )
    all_results.extend(round_results)

    best_r0 = max(round_results, key=lambda r: r.composite_score, default=None)
    critical_r0 = any(r.severity == SeverityBadge.CRITICAL for r in round_results)

    rounds.append(IterativeRound(
        round_number=0,
        attacks_evaluated=len(round_results),
        best_score=best_r0.composite_score if best_r0 else 0.0,
        best_attack=best_r0.attack if best_r0 else "",
        critical_found=critical_r0,
        early_exit=critical_r0,
    ))
    if on_event:
        await on_event({"type": "round_complete", "round": 0,
                        "best_score": rounds[-1].best_score,
                        "critical_found": critical_r0})

    # ── Iterative rounds (PAIR loop) ───────────────────────────────────────
    if not critical_r0:
        for rnd in range(1, max_rounds + 1):
            sorted_so_far = sorted(all_results, key=lambda r: r.composite_score, reverse=True)
            seeds = sorted_so_far[:5]

            evolved_attacks: list = []
            evo_tasks = [
                generate_evolved_attacks(
                    prompt, category, intent,
                    seed_attack=s.attack,
                    seed_score=s.composite_score,
                    n=max(2, attacks_per_technique),
                )
                for s in seeds
            ]
            evo_results = await asyncio.gather(*evo_tasks, return_exceptions=True)
            for r in evo_results:
                if isinstance(r, list):
                    evolved_attacks.extend(r)

            if not evolved_attacks:
                break

            round_results = await _score_batch(
                evolved_attacks, round_number=rnd,
                on_result=on_result, target_system_prompt=target_system_prompt,
            )
            all_results.extend(round_results)

            best_rn = max(round_results, key=lambda r: r.composite_score, default=None)
            critical_rn = any(r.severity == SeverityBadge.CRITICAL for r in round_results)

            rounds.append(IterativeRound(
                round_number=rnd,
                attacks_evaluated=len(round_results),
                best_score=best_rn.composite_score if best_rn else 0.0,
                best_attack=best_rn.attack if best_rn else "",
                critical_found=critical_rn,
                early_exit=critical_rn,
            ))
            if on_event:
                await on_event({"type": "round_complete", "round": rnd,
                                "best_score": rounds[-1].best_score,
                                "critical_found": critical_rn})
            if critical_rn:
                break

    # ── Post-loop: multi-judge top 10, success rate top 3, benchmarks ──────
    all_results.sort(key=lambda r: r.composite_score, reverse=True)

    top10 = all_results[:10]
    mj_tasks = [multi_judge_response(r.attack, r.model_response) for r in top10]
    mj_results = await asyncio.gather(*mj_tasks, return_exceptions=True)
    for r, mj in zip(top10, mj_results):
        if not isinstance(mj, Exception):
            r.multi_judge = mj
            r.judge_score = mj.mean_score
            r.violated = mj.violated
            from app.services.scorer import assign_severity
            r.composite_score = _enhanced_composite(
                mj.mean_score, r.enrichment, r.deepeval_result,
                r.embedding_result, r.pii_detection
            )
            r.severity = assign_severity(r.composite_score)

    all_results.sort(key=lambda r: r.composite_score, reverse=True)

    success_rates: list[SuccessRateResult] = []
    sr_tasks = [
        score_attack_n_times(
            r.attack, r.technique,
            n=success_rate_runs,
            target_system_prompt=target_system_prompt,
        )
        for r in all_results[:3]
    ]
    sr_results = await asyncio.gather(*sr_tasks, return_exceptions=True)
    for sr in sr_results:
        if isinstance(sr, SuccessRateResult):
            success_rates.append(sr)

    model_benchmarks: list[ModelProbeResult] = []
    if all_results:
        model_benchmarks = await benchmark_models(all_results[0].attack)

    if on_event:
        await on_event({"type": "post_processing_complete"})

    total = len(all_results)
    composite_risk = round(statistics.mean(r.composite_score for r in all_results), 4) if all_results else 0.0
    violated_count = sum(1 for r in all_results if r.violated)
    violation_rate = round(violated_count / total, 4) if total else 0.0

    severity_distribution = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "SAFE": 0}
    for r in all_results:
        severity_distribution[r.severity.value] += 1

    return RedTeamResponse(
        original_prompt=prompt,
        analysis=analysis,
        rounds=rounds,
        all_results=all_results,
        best_attack=all_results[0] if all_results else None,
        success_rates=success_rates,
        model_benchmarks=model_benchmarks,
        total_attacks_tried=total,
        composite_risk=composite_risk,
        violation_rate=violation_rate,
        severity_distribution=severity_distribution,
        evaluation_time_ms=round((time.monotonic() - start) * 1000, 2),
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
