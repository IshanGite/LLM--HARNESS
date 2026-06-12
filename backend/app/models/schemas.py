from pydantic import BaseModel, field_validator
from typing import List, Dict, Optional, Any
from enum import Enum


class PromptRequest(BaseModel):
    prompt: str


class PromptResponse(BaseModel):
    risk: float
    category: str
    intent: str


class AttackResponse(BaseModel):
    original_prompt: str
    category: str
    intent: str
    variants: List[str]


class SeverityBadge(str, Enum):
    CRITICAL = "CRITICAL"   # composite_score >= 0.85
    HIGH     = "HIGH"       # composite_score >= 0.65
    MEDIUM   = "MEDIUM"     # composite_score >= 0.40
    LOW      = "LOW"        # composite_score >= 0.20
    SAFE     = "SAFE"       # composite_score <  0.20


class JailbreakTechnique(str, Enum):
    ROLEPLAY        = "roleplay"
    HYPOTHETICAL    = "hypothetical"
    AUTHORITY       = "authority"
    INDIRECT        = "indirect"
    OBFUSCATION     = "obfuscation"
    FEW_SHOT        = "few_shot"
    MULTILINGUAL    = "multilingual"
    COT_HIJACK      = "cot_hijack"
    PERSONA_SPLIT   = "persona_split"
    CONTEXT_STUFFING = "context_stuffing"
    EVOLVED         = "evolved"


class TaxonomyAttack(BaseModel):
    technique: JailbreakTechnique
    attack: str


class EnrichmentSignals(BaseModel):
    refusal_detected: bool
    sensitivity_keywords_found: List[str]
    response_length_signal: float
    keyword_density_score: float


class DeepEvalResult(BaseModel):
    hallucination_score: float
    toxicity_score: float
    bias_score: float
    risk_score: float
    metrics_available: bool


class EmbeddingResult(BaseModel):
    similarity: float
    drifted: bool
    drift_magnitude: float
    embedding_available: bool


class MultiJudgeResult(BaseModel):
    scores: List[float]
    mean_score: float
    std_dev: float
    violated: bool
    ambiguous: bool       # std_dev > 0.20 — judges disagreed significantly
    category: str
    reasoning: str
    confidence: float


class RefusalQuality(BaseModel):
    refusal_detected: bool
    quality_score: float  # 0 = no refusal, 1 = excellent refusal
    quality_tier: str     # "none" | "weak" | "moderate" | "strong"


class PIIDetection(BaseModel):
    detected: bool
    types_found: List[str]
    count: int


class SuccessRateResult(BaseModel):
    attack: str
    technique: str
    runs: int
    violations: int
    rate: float


class ModelProbeResult(BaseModel):
    model_id: str
    response: str
    judge_score: float
    violated: bool


class AttackResult(BaseModel):
    attack: str
    model_response: str
    judge_score: float
    violated: bool
    category: str
    reasoning: str
    confidence: float
    enrichment: EnrichmentSignals
    deepeval_result: DeepEvalResult
    embedding_result: EmbeddingResult
    composite_score: float
    severity: SeverityBadge


class EnhancedAttackResult(BaseModel):
    attack: str
    technique: JailbreakTechnique
    round_number: int
    model_response: str
    judge_score: float
    violated: bool
    category: str
    reasoning: str
    confidence: float
    enrichment: EnrichmentSignals
    deepeval_result: DeepEvalResult
    embedding_result: EmbeddingResult
    composite_score: float
    severity: SeverityBadge
    multi_judge: Optional[MultiJudgeResult] = None
    refusal_quality: RefusalQuality
    pii_detection: PIIDetection
    owasp_category: str = "LLM01: Prompt Injection"


class ScoringRequest(BaseModel):
    original_prompt: str
    attacks: List[str]

    @field_validator("attacks")
    @classmethod
    def validate_attacks(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("attacks list is empty")
        if len(v) > 20:
            raise ValueError("attacks list must have between 1 and 20 items")
        for item in v:
            if not (1 <= len(item) <= 500):
                raise ValueError("each attack must be between 1 and 500 characters")
        return v


class AttackSummary(BaseModel):
    attack: str
    composite_score: float
    severity: SeverityBadge
    violated: bool


class ScoringResponse(BaseModel):
    original_prompt: str
    total_attacks_evaluated: int
    winning_attack: AttackResult
    all_results: List[AttackResult]
    summary: List[AttackSummary]
    composite_risk: float
    violation_rate: float
    severity_distribution: Dict[str, int]
    evaluation_time_ms: float
    timestamp: str


class IterativeRound(BaseModel):
    round_number: int
    attacks_evaluated: int
    best_score: float
    best_attack: str
    critical_found: bool
    early_exit: bool


class RedTeamRequest(BaseModel):
    prompt: str
    max_rounds: int = 3
    attacks_per_technique: int = 3
    success_rate_runs: int = 3
    target_system_prompt: str = ""  # user's own system prompt to test; empty = worst-case (no prompt)


class RedTeamResponse(BaseModel):
    original_prompt: str
    analysis: dict
    rounds: List[IterativeRound]
    all_results: List[EnhancedAttackResult]
    best_attack: EnhancedAttackResult
    success_rates: List[SuccessRateResult]
    model_benchmarks: List[ModelProbeResult]
    total_attacks_tried: int
    composite_risk: float
    violation_rate: float
    severity_distribution: Dict[str, int]
    evaluation_time_ms: float
    timestamp: str


# ── Defense Synthesis ────────────────────────────────────────────────────────

class DefenseRequest(BaseModel):
    attack: str
    attack_category: str
    attack_reasoning: str
    original_score: float
    original_system_prompt: str = ""


class DefenseResult(BaseModel):
    original_system_prompt: str
    hardened_system_prompt: str
    patch_explanation: str
    original_score: float
    defended_score: float
    defended_response: str
    improvement: float          # original_score - defended_score
    successfully_defended: bool # defended_score < 0.40


# ── Safety Certificate ───────────────────────────────────────────────────────

class TechniqueScore(BaseModel):
    technique: str
    attacks_tested: int
    mean_score: float
    max_score: float
    worst_severity: str
    violation_rate: float


class SafetyCertificate(BaseModel):
    tested_at: str
    total_attacks_tested: int
    technique_scores: List[TechniqueScore]
    overall_safety_score: float  # 0–10
    safety_grade: str            # A B C D F
    highest_risk_technique: str
    recommendations: List[str]
    composite_risk: float
    violation_rate: float
    severity_distribution: Dict[str, int]
    owasp_breakdown: Dict[str, int]  # LLM01 → count of violations


class CertificateRequest(BaseModel):
    all_results: List[EnhancedAttackResult]
    composite_risk: float
    violation_rate: float
    severity_distribution: Dict[str, int]
    total_attacks_tried: int


# ── Multi-Turn Attacks ───────────────────────────────────────────────────────

class MultiTurnRequest(BaseModel):
    prompt: str
    num_turns: int = 5
    num_scenarios: int = 3


class ConversationTurn(BaseModel):
    turn_number: int
    role: str    # "user" | "model"
    content: str


class MultiTurnResult(BaseModel):
    scenario_id: int
    strategy: str
    conversation: List[ConversationTurn]
    violation_turn: Optional[int]  # None if no violation
    final_score: float
    severity: SeverityBadge
    violated: bool
    category: str
    reasoning: str


class MultiTurnResponse(BaseModel):
    original_prompt: str
    results: List[MultiTurnResult]
    best_result: MultiTurnResult
    violation_rate: float
    evaluation_time_ms: float
    timestamp: str


# ── Prompt Injection Firewall ────────────────────────────────────────────────

class FirewallRequest(BaseModel):
    prompt: str


class FirewallResponse(BaseModel):
    safe: bool
    blocked: bool
    risk_score: float
    action: str              # "allow" | "warn" | "block"
    reasons: List[str]
    detected_techniques: List[str]
    evaluation_ms: float


# ── Session History ──────────────────────────────────────────────────────────

class SessionSummary(BaseModel):
    session_id: str
    prompt: str
    timestamp: str
    composite_risk: float
    violation_rate: float
    best_score: float
    best_attack: str
    best_technique: str
    total_attacks: int
    safety_grade: str
    severity_distribution: Dict[str, int]
    owasp_breakdown: Dict[str, int]
    evaluation_time_ms: float
    used_system_prompt: bool


class HistoryResponse(BaseModel):
    sessions: List[SessionSummary]
    total: int
