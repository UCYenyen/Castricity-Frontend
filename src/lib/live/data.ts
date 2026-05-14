import type { LiveAnomaly, LiveMetrics, LiveTick } from "@/types/live";
import { buildSeries, computeMetrics, ANOMALY_DETAILS } from "@/lib/dashboard/data";
import type { AnomalyKey } from "@/types/dashboard";

/**
 * Generate a synthetic live tick for the given timestamp.
 * In production this would be replaced by a call to the Python
 * inference backend; here we derive values from the same
 * deterministic demand curve used elsewhere.
 */
export function generateLiveTick(now: Date): LiveTick {
  const series = buildSeries({
    regionId: "sys",
    historyHours: 2,
    futureHours: 1,
    now,
    seedOffset: now.getMinutes(),
  });
  const last = series.history[series.history.length - 1];
  const delta = last.actual - last.predicted;
  const deltaPct = (delta / last.predicted) * 100;
  return {
    t: now,
    actual: +last.actual.toFixed(2),
    predicted: +last.predicted.toFixed(2),
    delta: +delta.toFixed(2),
    deltaPct: +deltaPct.toFixed(2),
  };
}

/**
 * Generate rolling metrics from recent synthetic history.
 */
export function generateLiveMetrics(): LiveMetrics {
  const series = buildSeries({
    regionId: "sys",
    historyHours: 24,
    futureHours: 1,
    now: new Date(),
  });
  const m = computeMetrics(series.history);
  const trend: LiveMetrics["trend"] =
    m.mape < 2.0 ? "improving" : m.mape < 3.5 ? "stable" : "degrading";
  return {
    mae: +m.mae.toFixed(2),
    rmse: +m.rmse.toFixed(2),
    mape: +m.mape.toFixed(2),
    bias: +m.bias.toFixed(2),
    hit: +m.hit.toFixed(2),
    trend,
  };
}

/**
 * Generate live anomaly alerts.
 */
export function generateLiveAnomalies(): LiveAnomaly[] {
  const series = buildSeries({
    regionId: "sys",
    historyHours: 24,
    futureHours: 1,
    now: new Date(),
  });
  return series.history
    .filter((p) => p.anomaly != null)
    .map((p) => {
      const key = p.anomaly as AnomalyKey;
      const detail = ANOMALY_DETAILS[key];
      const delta = p.actual - p.predicted;
      return {
        id: `${key}-${p.t.getTime()}`,
        t: p.t,
        severity: detail.sev,
        title: detail.title,
        asset: "System total",
        description: detail.desc,
        delta: +delta.toFixed(2),
        factors: detail.factors,
      };
    });
}
