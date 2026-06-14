"use client";

import { motion } from "framer-motion";
import type { SafetyCertificate } from "@/lib/api";
import { formatPct } from "@/lib/utils";
import SeverityBadge from "./SeverityBadge";
import type { Severity } from "@/lib/api";

const GRADE_COLOR: Record<string, string> = {
  A: "var(--color-lichen)",
  B: "#6fcfb4",
  C: "var(--color-plum-voltage)",
  D: "var(--color-amber-spark)",
  F: "#ff5b5b",
};

export default function CertificateView({ data }: { data: SafetyCertificate }) {
  const gradeColor = GRADE_COLOR[data.safety_grade] ?? GRADE_COLOR.F;
  const owaspEntries = Object.entries(data.owasp_breakdown ?? {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Grade + headline stats */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 1, background: "rgba(255,255,255,0.07)", borderRadius: 22, overflow: "hidden" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ background: "#000", padding: "32px 36px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 130 }}
        >
          <div style={{
            fontFamily: "var(--font-acronym)",
            fontWeight: 700,
            fontSize: 90,
            lineHeight: 1,
            color: gradeColor,
            letterSpacing: "-0.04em",
          }}>
            {data.safety_grade}
          </div>
          <p className="type-eyebrow" style={{ color: "var(--color-smoke)", margin: "8px 0 0", textAlign: "center" }}>
            Safety Grade
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ background: "#000", padding: "26px 30px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}
        >
          <div>
            <div className="score-display tabular" style={{ fontSize: 34, color: gradeColor, lineHeight: 1, marginBottom: 4 }}>
              {data.overall_safety_score.toFixed(1)}
              <span style={{ fontSize: 16, opacity: 0.4, marginLeft: 2 }}>/10</span>
            </div>
            <p className="type-eyebrow" style={{ color: "var(--color-smoke)", margin: 0 }}>Overall safety score</p>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Attacks tested",  v: String(data.total_attacks_tested) },
              { label: "Composite risk",  v: formatPct(data.composite_risk) },
              { label: "Violation rate",  v: formatPct(data.violation_rate) },
            ].map(s => (
              <div key={s.label}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--color-ash)" }}>{s.v}</span>
                <p className="type-eyebrow" style={{ color: "var(--color-smoke)", margin: "3px 0 0" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Technique breakdown */}
      {data.technique_scores?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 10 }}>Technique breakdown</p>
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>
            {/* Header row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 56px 56px 80px",
              gap: 10,
              padding: "10px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              {["Technique", "Avg", "Viol%", "Severity"].map((h, i) => (
                <span key={h} style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  textAlign: i > 0 ? "right" : "left",
                }}>
                  {h}
                </span>
              ))}
            </div>
            {data.technique_scores.map((t, i) => (
              <div
                key={t.technique}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 56px 56px 80px",
                  gap: 10,
                  alignItems: "center",
                  padding: "13px 20px",
                  borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--color-ash)",
                    textTransform: "capitalize",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {t.technique.replace(/_/g, " ")}
                  </span>
                  {t.technique === data.highest_risk_technique && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-amber-spark)", letterSpacing: "0.06em", flexShrink: 0 }}>
                      ▲ MAX
                    </span>
                  )}
                </div>
                <span className="tabular" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-smoke)", textAlign: "right" }}>
                  {formatPct(t.mean_score)}
                </span>
                <span className="tabular" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-smoke)", textAlign: "right" }}>
                  {formatPct(t.violation_rate)}
                </span>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <SeverityBadge severity={t.severity as Severity} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {data.recommendations?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 10 }}>Recommendations</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {data.recommendations.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "13px 18px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-plum-voltage)", flexShrink: 0, paddingTop: 1 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-ash)", lineHeight: 1.65, margin: 0 }}>
                  {r}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* OWASP */}
      {owaspEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
        >
          <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 10 }}>OWASP LLM Top 10</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {owaspEntries.map(([key, val]) => (
              <div
                key={key}
                style={{
                  padding: "7px 13px",
                  border: "1px solid rgba(128,82,255,0.25)",
                  borderRadius: 10,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-plum-voltage)", letterSpacing: "0.05em" }}>
                  {key}
                </span>
                {typeof val === "number" && (
                  <span className="tabular" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-smoke)" }}>
                    {formatPct(val)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.18)", margin: 0 }}>
        {new Date(data.tested_at).toLocaleString()}
      </p>
    </div>
  );
}
