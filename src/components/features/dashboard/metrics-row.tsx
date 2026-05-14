"use client";
import { fmtMW, fmtSigned } from "@/lib/dashboard/format";
import type { Metrics } from "@/types/dashboard";

type Tone = "good" | "warn" | "bad" | "info";

const TONE_COLOR: Record<Tone, string> = {
  good: "var(--accent-green)",
  warn: "var(--accent-orange)",
  bad: "var(--accent-red)",
  info: "var(--accent-cyan-2)",
};

function VM({
  label, value, unit, sub, tone,
}: { label: string; value: string; unit?: string; sub: string; tone: Tone }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ background: "rgba(15,23,41,0.55)", border: "1px solid var(--card-border)" }}
    >
      <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mono text-[18px] font-semibold mt-0.5" style={{ color: TONE_COLOR[tone], letterSpacing: "-0.01em" }}>
        {value}
        {unit && (
          <span className="text-[11px] ml-1" style={{ color: "var(--text-muted)" }}>
            {unit}
          </span>
        )}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>
        {sub}
      </div>
    </div>
  );
}

export function MetricsRow({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-3.5">
      <VM
        label="MAPE"
        value={metrics.mape.toFixed(2)}
        unit="%"
        sub="Rata-rata galat % absolut"
        tone={metrics.mape < 2.5 ? "good" : metrics.mape < 4 ? "warn" : "bad"}
      />
      <VM label="RMSE" value={fmtMW(metrics.rmse)} unit="MW" sub="Akar rata-rata galat kuadrat" tone="info" />
      <VM label="MAE" value={fmtMW(metrics.mae)} unit="MW" sub="Rata-rata galat absolut" tone="info" />
      <VM
        label="Bias"
        value={fmtSigned(metrics.bias, 0)}
        unit="MW"
        sub="Rata-rata residual"
        tone={Math.abs(metrics.bias) < 30 ? "good" : "warn"}
      />
      <VM
        label="Hit · ±3%"
        value={metrics.hit.toFixed(0)}
        unit="%"
        sub="Dalam toleransi"
        tone={metrics.hit > 80 ? "good" : metrics.hit > 60 ? "warn" : "bad"}
      />
    </div>
  );
}
