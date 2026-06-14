const API_BASE =
  typeof window !== "undefined"
    ? "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── CORE TYPES ───────────────────────────────────────────────────────────────

export interface AnalyzeResponse {
  risk: number;
  category: string;
  intent: string;
}

export interface AttackResponse {
  original_prompt: string;
  category: string;
  intent: string;
  variants: string[];
}

export interface EnrichmentSignals {
  refusal_detected: boolean;
  sensitivity_keywords_found: string[];
  response_length_signal: number;
  keyword_density_score: number;
}

export interface DeepEvalResult {
  hallucination_score: number;
  toxicity_score: number;
  bias_score: number;
  risk_score: number;
  metrics_available: boolean;
}

export interface EmbeddingResult {
  similarity: number;
  drifted: boolean;
  drift_magnitude: number;
  embedding_available: boolean;
}

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";

export interface AttackResult {
  attack: string;
  model_response: string;
  judge_score: number;
  violated: boolean;
  category: string;
  reasoning: string;
  confidence: number;
  enrichment: EnrichmentSignals;
  deepeval_result: DeepEvalResult;
  embedding_result: EmbeddingResult;
  composite_score: number;
  severity: Severity;
}

export interface AttackSummary {
  attack: string;
  composite_score: number;
  severity: Severity;
  violated: boolean;
}

export interface ScoringResponse {
  original_prompt: string;
  total_attacks_evaluated: number;
  winning_attack: AttackResult;
  all_results: AttackResult[];
  summary: AttackSummary[];
  composite_risk: number;
  violation_rate: number;
  severity_distribution: Record<string, number>;
  evaluation_time_ms: number;
  timestamp: string;
}

// ─── DEFENSE ─────────────────────────────────────────────────────────────────

export interface DefenseResult {
  original_system_prompt: string;
  hardened_system_prompt: string;
  patch_explanation: string;
  original_score: number;
  defended_score: number;
  defended_response: string;
  improvement: number;
  successfully_defended: boolean;
}

// ─── CERTIFICATE ─────────────────────────────────────────────────────────────

export interface TechniqueScore {
  technique: string;
  attacks_tested: number;
  mean_score: number;
  max_score: number;
  violation_rate: number;
  severity: string;
}

export interface SafetyCertificate {
  tested_at: string;
  total_attacks_tested: number;
  technique_scores: TechniqueScore[];
  overall_safety_score: number;
  safety_grade: string;
  highest_risk_technique: string;
  recommendations: string[];
  composite_risk: number;
  violation_rate: number;
  severity_distribution: Record<string, number>;
  owasp_breakdown: Record<string, unknown>;
}

// ─── FIREWALL ─────────────────────────────────────────────────────────────────

export interface FirewallResponse {
  safe: boolean;
  blocked: boolean;
  risk_score: number;
  action: "allow" | "warn" | "block";
  reasons: string[];
  detected_techniques: string[];
  evaluation_ms: number;
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────

export interface SessionSummary {
  session_id: string;
  prompt: string;
  timestamp: string;
  composite_risk: number;
  violation_rate: number;
  best_score: number;
  best_attack: string;
  best_technique: string;
  total_attacks: number;
  safety_grade: string;
  severity_distribution: Record<string, number>;
  owasp_breakdown: Record<string, unknown>;
  evaluation_time_ms: number;
  used_system_prompt: boolean;
}

export interface HistoryResponse {
  sessions: SessionSummary[];
  total: number;
}

// ─── RED TEAM ─────────────────────────────────────────────────────────────────

export interface EnhancedAttackResult {
  attack: string;
  technique: string;
  model_response: string;
  composite_score: number;
  severity: Severity;
  violated: boolean;
  judge_score: number;
  reasoning: string;
  enrichment: EnrichmentSignals;
  deepeval_result: DeepEvalResult;
  embedding_result: EmbeddingResult;
}

export interface RedTeamResponse {
  original_prompt: string;
  all_results: EnhancedAttackResult[];
  best_attack: EnhancedAttackResult;
  total_attacks_tried: number;
  composite_risk: number;
  violation_rate: number;
  severity_distribution: Record<string, number>;
  evaluation_time_ms: number;
  timestamp: string;
}

// ─── HTTP HELPERS ─────────────────────────────────────────────────────────────

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.detail ?? text);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────

export const analyzePrompt = (prompt: string) =>
  request<AnalyzeResponse>("/analyze", { prompt });

export const generateAttacks = (prompt: string) =>
  request<AttackResponse>("/attacks", { prompt });

export const scoreAttacks = (original_prompt: string, attacks: string[]) =>
  request<ScoringResponse>("/score", { original_prompt, attacks });

export const synthesizeDefense = (
  attack: string,
  attack_category: string,
  attack_reasoning: string,
  original_score: number,
  original_system_prompt = ""
) =>
  request<DefenseResult>("/defend", {
    attack,
    attack_category,
    attack_reasoning,
    original_score,
    original_system_prompt,
  });

export const generateCertificate = (
  all_results: AttackResult[],
  composite_risk: number,
  violation_rate: number,
  severity_distribution: Record<string, number>,
  total_attacks_tried: number
) =>
  request<SafetyCertificate>("/certificate", {
    all_results,
    composite_risk,
    violation_rate,
    severity_distribution,
    total_attacks_tried,
  });

export const checkFirewall = (prompt: string) =>
  request<FirewallResponse>("/firewall", { prompt });

export const getHistory = (limit = 20) =>
  get<HistoryResponse>(`/history?limit=${limit}`);

export const getSession = (sessionId: string) =>
  get<SessionSummary>(`/history/${sessionId}`);

export async function streamRedTeam(
  prompt: string,
  options: {
    max_rounds?: number;
    attacks_per_technique?: number;
    target_system_prompt?: string;
  },
  onEvent: (event: Record<string, unknown>) => void
): Promise<RedTeamResponse> {
  const res = await fetch(`${API_BASE}/redteam/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      max_rounds: options.max_rounds ?? 2,
      attacks_per_technique: options.attacks_per_technique ?? 2,
      target_system_prompt: options.target_system_prompt ?? "",
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResponse: RedTeamResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6)) as Record<string, unknown>;
          onEvent(data);
          if (data.type === "complete") {
            finalResponse = data as unknown as RedTeamResponse;
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
  }

  if (!finalResponse) throw new Error("Stream ended without a complete event");
  return finalResponse;
}
