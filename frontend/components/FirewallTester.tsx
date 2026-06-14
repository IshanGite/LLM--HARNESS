"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, ShieldOff } from "lucide-react";
import { checkFirewall } from "@/lib/api";
import type { FirewallResponse } from "@/lib/api";

const ACTION_CONFIG = {
  allow: {
    label: "ALLOW",
    color: "var(--color-lichen)",
    Icon: Shield,
    border: "rgba(21,132,110,0.35)",
  },
  warn: {
    label: "WARN",
    color: "var(--color-amber-spark)",
    Icon: ShieldAlert,
    border: "rgba(255,184,41,0.35)",
  },
  block: {
    label: "BLOCK",
    color: "#ff5b5b",
    Icon: ShieldOff,
    border: "rgba(255,91,91,0.35)",
  },
};

export default function FirewallTester() {
  const [prompt, setPrompt]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<FirewallResponse | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const run = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await checkFirewall(prompt.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Firewall check failed");
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? ACTION_CONFIG[result.action] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      <div>
        <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 16 }}>Firewall</p>
        <h1 style={{
          fontFamily: "var(--font-acronym)",
          fontWeight: 300,
          fontSize: "clamp(36px, 4vw, 52px)",
          lineHeight: 1.0,
          letterSpacing: "-0.04em",
          color: "var(--color-bone)",
          margin: "0 0 14px",
        }}>
          Check a prompt.
        </h1>
        <p className="type-base" style={{ color: "var(--color-smoke)", margin: 0, maxWidth: 480 }}>
          Real-time detection across 13 jailbreak signatures and deepeval analysis.
          Returns allow, warn, or block with reasoning.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <textarea
          className="dala-textarea"
          rows={5}
          placeholder="Enter a prompt to check…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run(); }}
        />
        <p style={{ fontFamily: "var(--font-acronym)", fontSize: 12, color: "var(--color-smoke)", letterSpacing: "0.021em" }}>
          <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>⌘ Enter</kbd> to check
        </p>
      </div>

      <button
        className="btn-plum"
        onClick={run}
        disabled={!prompt.trim() || loading}
        style={{ alignSelf: "flex-start" }}
      >
        {loading ? <><span className="spinner" />Checking…</> : "Check Prompt"}
      </button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: "14px 18px", border: "1px solid rgba(255,184,41,0.3)", borderRadius: 16, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-amber-spark)" }}
          >
            {error}
          </motion.div>
        )}

        {result && cfg && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div className="divider" />

            {/* Action verdict */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "20px 24px",
              borderRadius: 20,
              border: `1px solid ${cfg.border}`,
            }}>
              <cfg.Icon size={22} color={cfg.color} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "var(--font-acronym)",
                  fontWeight: 700,
                  fontSize: 30,
                  color: cfg.color,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  marginBottom: 5,
                }}>
                  {cfg.label}
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-smoke)", margin: 0 }}>
                  Risk score:{" "}
                  <span style={{ color: "var(--color-ash)" }}>{(result.risk_score * 100).toFixed(0)}</span>
                  {" · "}
                  {result.evaluation_ms.toFixed(1)}ms
                </p>
              </div>
            </div>

            {/* Detected techniques */}
            {result.detected_techniques.length > 0 && (
              <div>
                <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 10 }}>
                  Detected techniques
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {result.detected_techniques.map(t => (
                    <span key={t} style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      padding: "4px 12px",
                      borderRadius: 20,
                      border: "1px solid rgba(255,91,91,0.3)",
                      color: "#ff5b5b",
                      letterSpacing: "0.04em",
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reasons */}
            {result.reasons.length > 0 && (
              <div>
                <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 10 }}>Reasons</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {result.reasons.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "10px 14px",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12,
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-smoke)", paddingTop: 2, flexShrink: 0 }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-ash)", lineHeight: 1.6, margin: 0 }}>
                        {r}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
