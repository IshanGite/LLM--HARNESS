"use client";

import { motion } from "framer-motion";
import { Download } from "lucide-react";
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

const GRADE_HEX: Record<string, string> = {
  A: "#15846e", B: "#6fcfb4", C: "#8052ff", D: "#ffb829", F: "#ff5b5b",
};

function buildCertificateHtml(data: SafetyCertificate): string {
  const gradeHex = GRADE_HEX[data.safety_grade] ?? "#ff5b5b";
  const techRows = (data.technique_scores ?? []).map(t => `
    <tr>
      <td>${t.technique.replace(/_/g, " ")}${t.technique === data.highest_risk_technique ? " ▲" : ""}</td>
      <td>${(t.mean_score * 100).toFixed(0)}%</td>
      <td>${(t.violation_rate * 100).toFixed(0)}%</td>
      <td>${t.severity ?? "—"}</td>
    </tr>`).join("");

  const recs = (data.recommendations ?? []).map((r, i) =>
    `<li><strong>${String(i + 1).padStart(2, "0")}</strong> ${r}</li>`
  ).join("");

  const owasp = Object.entries(data.owasp_breakdown ?? {}).map(([k, v]) =>
    `<span class="tag">${k}: ${v}</span>`
  ).join(" ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>LLM Safety Certificate — Grade ${data.safety_grade}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; background: #fff; color: #111; padding: 48px; max-width: 800px; margin: 0 auto; }
  h1 { font-family: Georgia, serif; font-size: 28px; font-weight: 400; letter-spacing: -0.02em; margin-bottom: 4px; }
  .subtitle { font-size: 12px; color: #666; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 32px; }
  .grade-block { display: flex; align-items: center; gap: 32px; border: 2px solid ${gradeHex}; border-radius: 12px; padding: 24px 32px; margin-bottom: 32px; }
  .grade-letter { font-size: 80px; font-weight: 700; color: ${gradeHex}; line-height: 1; font-family: Georgia, serif; }
  .stats { display: flex; gap: 32px; flex-wrap: wrap; }
  .stat label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-top: 4px; }
  .stat .val { font-size: 22px; font-weight: 700; color: ${gradeHex}; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin: 24px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #888; padding: 6px 10px; border-bottom: 2px solid #eee; }
  td { padding: 9px 10px; border-bottom: 1px solid #f0f0f0; }
  ol { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  li { padding: 10px 14px; background: #f8f8f8; border-radius: 6px; font-size: 13px; line-height: 1.6; }
  li strong { color: ${gradeHex}; margin-right: 8px; }
  .tag { display: inline-block; padding: 3px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; margin: 2px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; display: flex; justify-content: space-between; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <p class="subtitle">LLM Harness — AI Safety Report</p>
  <h1>Safety Certificate</h1>

  <div class="grade-block">
    <div class="grade-letter">${data.safety_grade}</div>
    <div class="stats">
      <div class="stat"><div class="val">${data.overall_safety_score.toFixed(1)}/10</div><label>Safety score</label></div>
      <div class="stat"><div class="val">${data.total_attacks_tested}</div><label>Attacks tested</label></div>
      <div class="stat"><div class="val">${(data.composite_risk * 100).toFixed(0)}%</div><label>Composite risk</label></div>
      <div class="stat"><div class="val">${(data.violation_rate * 100).toFixed(0)}%</div><label>Violation rate</label></div>
    </div>
  </div>

  ${data.technique_scores?.length ? `
  <h2>Technique breakdown</h2>
  <table>
    <thead><tr><th>Technique</th><th>Avg score</th><th>Viol %</th><th>Severity</th></tr></thead>
    <tbody>${techRows}</tbody>
  </table>` : ""}

  ${data.recommendations?.length ? `
  <h2>Recommendations</h2>
  <ol>${recs}</ol>` : ""}

  ${owasp ? `
  <h2>OWASP LLM Top 10</h2>
  <div>${owasp}</div>` : ""}

  <div class="footer">
    <span>Generated ${new Date(data.tested_at).toLocaleString()}</span>
    <span>LLM Harness — llm-safety.dev</span>
  </div>
</body>
</html>`;
}

function downloadCertificate(data: SafetyCertificate) {
  const html = buildCertificateHtml(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `safety-certificate-grade-${data.safety_grade}-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CertificateView({ data }: { data: SafetyCertificate }) {
  const gradeColor = GRADE_COLOR[data.safety_grade] ?? GRADE_COLOR.F;
  const owaspEntries = Object.entries(data.owasp_breakdown ?? {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Download */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => downloadCertificate(data)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "8px 16px",
            cursor: "pointer",
            fontFamily: "var(--font-acronym)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--color-smoke)",
            transition: "border-color 150ms, color 150ms",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-bone)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-smoke)"; }}
        >
          <Download size={12} />
          Download
        </button>
      </div>

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
