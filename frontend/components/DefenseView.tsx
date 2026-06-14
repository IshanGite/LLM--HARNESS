"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ShieldCheck, ShieldAlert } from "lucide-react";
import type { DefenseResult } from "@/lib/api";

function CopyBtn({ text }: { text: string }) {
  const [c, setC] = useState(false);
  return (
    <button
      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: "var(--color-smoke)" }}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setC(true);
        setTimeout(() => setC(false), 1600);
      }}
      aria-label="Copy"
    >
      {c ? <Check size={12} color="var(--color-lichen)" /> : <Copy size={12} />}
    </button>
  );
}

export default function DefenseView({ data }: { data: DefenseResult }) {
  const delta = Math.abs(data.improvement * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "18px 22px",
          borderRadius: 20,
          border: data.successfully_defended
            ? "1px solid rgba(21,132,110,0.35)"
            : "1px solid rgba(255,184,41,0.3)",
        }}
      >
        {data.successfully_defended
          ? <ShieldCheck size={18} color="var(--color-lichen)" />
          : <ShieldAlert size={18} color="var(--color-amber-spark)" />
        }
        <div>
          <p style={{
            fontFamily: "var(--font-acronym)",
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: "-0.01em",
            color: data.successfully_defended ? "var(--color-lichen)" : "var(--color-amber-spark)",
            margin: "0 0 2px",
          }}>
            {data.successfully_defended ? "Defense successful" : "Partial hardening"}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-smoke)", margin: 0 }}>
            Score reduced by {delta.toFixed(1)} points
          </p>
        </div>
      </motion.div>

      {/* Before / After */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 1,
          background: "rgba(255,255,255,0.07)",
          borderRadius: 22,
          overflow: "hidden",
        }}
      >
        <div style={{ background: "#000", padding: "22px 26px" }}>
          <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 8 }}>Before</p>
          <div className="score-display tabular" style={{ fontSize: 50, color: "var(--color-amber-spark)", lineHeight: 1, marginBottom: 4 }}>
            {(data.original_score * 100).toFixed(0)}
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-smoke)", margin: 0 }}>composite risk</p>
        </div>
        <div style={{ background: "#000", padding: "22px 18px", display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "rgba(255,255,255,0.12)" }}>→</span>
        </div>
        <div style={{ background: "#000", padding: "22px 26px" }}>
          <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 8 }}>After</p>
          <div className="score-display tabular" style={{ fontSize: 50, color: "var(--color-lichen)", lineHeight: 1, marginBottom: 4 }}>
            {(data.defended_score * 100).toFixed(0)}
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-smoke)", margin: 0 }}>composite risk</p>
        </div>
      </motion.div>

      {/* Patch explanation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
      >
        <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 10 }}>Patch explanation</p>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--color-ash)",
          lineHeight: 1.7,
          margin: 0,
          padding: "14px 18px",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
        }}>
          {data.patch_explanation}
        </p>
      </motion.div>

      {/* Hardened prompt */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.19 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p className="type-eyebrow" style={{ color: "var(--color-smoke)", margin: 0 }}>Hardened system prompt</p>
          <CopyBtn text={data.hardened_system_prompt} />
        </div>
        <div style={{
          border: "1px solid rgba(21,132,110,0.25)",
          borderRadius: 14,
          padding: "14px 18px",
          maxHeight: 200,
          overflowY: "auto",
        }}>
          <pre style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--color-ash)",
            lineHeight: 1.7,
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {data.hardened_system_prompt}
          </pre>
        </div>
      </motion.div>

      {/* Defended response */}
      {data.defended_response && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <p className="type-eyebrow" style={{ color: "var(--color-smoke)", marginBottom: 10 }}>
            Model response (hardened)
          </p>
          <div style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "14px 18px",
            maxHeight: 140,
            overflowY: "auto",
          }}>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--color-smoke)",
              lineHeight: 1.65,
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {data.defended_response}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
