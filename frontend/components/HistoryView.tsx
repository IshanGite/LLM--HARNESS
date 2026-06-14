"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { getHistory } from "@/lib/api";
import type { SessionSummary } from "@/lib/api";
import { formatPct, formatMs } from "@/lib/utils";

const GRADE_COLOR: Record<string, string> = {
  A: "var(--color-lichen)",
  B: "#6fcfb4",
  C: "var(--color-plum-voltage)",
  D: "var(--color-amber-spark)",
  F: "#ff5b5b",
};

function SessionRow({ s, index }: { s: SessionSummary; index: number }) {
  const [open, setOpen] = useState(false);
  const riskColor =
    s.composite_risk >= 0.65 ? "var(--color-amber-spark)"
    : s.composite_risk >= 0.4 ? "var(--color-plum-voltage)"
    : "var(--color-lichen)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden" }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Grade */}
        <span style={{
          fontFamily: "var(--font-acronym)",
          fontWeight: 700,
          fontSize: 20,
          color: GRADE_COLOR[s.safety_grade] ?? "var(--color-smoke)",
          width: 24,
          flexShrink: 0,
          lineHeight: 1,
        }}>
          {s.safety_grade ?? "?"}
        </span>

        {/* Prompt + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--color-ash)",
            margin: "0 0 4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {s.prompt}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-smoke)", margin: 0 }}>
            {new Date(s.timestamp).toLocaleString()}
            {" · "}
            {s.total_attacks} attacks
            {" · "}
            {formatMs(s.evaluation_time_ms)}
          </p>
        </div>

        {/* Risk score */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="score-display tabular" style={{ fontSize: 18, color: riskColor, lineHeight: 1 }}>
            {(s.composite_risk * 100).toFixed(0)}
          </div>
          <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginTop: 2 }}>risk</p>
        </div>

        <ChevronDown
          size={14}
          style={{
            color: "var(--color-smoke)",
            transition: "transform 180ms",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  { label: "Violation rate", v: formatPct(s.violation_rate) },
                  { label: "Best score",     v: formatPct(s.best_score) },
                  { label: "Technique",      v: s.best_technique ?? "—" },
                ].map(x => (
                  <div key={x.label}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-ash)" }}>{x.v}</span>
                    <p className="type-eyebrow" style={{ color: "var(--color-smoke)", margin: "3px 0 0" }}>{x.label}</p>
                  </div>
                ))}
              </div>

              {s.best_attack && (
                <div>
                  <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 7 }}>Best attack</p>
                  <p style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--color-smoke)",
                    lineHeight: 1.65,
                    margin: 0,
                    padding: "10px 14px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                  }}>
                    {s.best_attack}
                  </p>
                </div>
              )}

              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.2)", margin: 0 }}>
                {s.session_id}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HistoryView() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    getHistory(30)
      .then(r => setSessions(r.sessions))
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      <div>
        <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 16 }}>History</p>
        <h1 style={{
          fontFamily: "var(--font-acronym)",
          fontWeight: 300,
          fontSize: "clamp(36px, 4vw, 52px)",
          lineHeight: 1.0,
          letterSpacing: "-0.04em",
          color: "var(--color-bone)",
          margin: "0 0 14px",
        }}>
          Past sessions.
        </h1>
        <p className="type-base" style={{ color: "var(--color-smoke)", margin: 0 }}>
          Stored red-team sessions, newest first.
        </p>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-smoke)" }}>
          <span className="spinner" /> Loading sessions…
        </div>
      )}

      {error && (
        <div style={{ padding: "14px 18px", border: "1px solid rgba(255,184,41,0.3)", borderRadius: 16, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-amber-spark)" }}>
          {error}
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-smoke)" }}>
          No sessions yet. Run a test to see it here.
        </p>
      )}

      {!loading && sessions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sessions.map((s, i) => (
            <SessionRow key={s.session_id} s={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
