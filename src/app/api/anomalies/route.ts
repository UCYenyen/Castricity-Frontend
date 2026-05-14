import { buildSeries, ANOMALY_DETAILS } from "@/lib/dashboard/data";
import type { AnomalyKey } from "@/types/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const series = buildSeries({
    regionId: "sys",
    historyHours: 168,
    futureHours: 48,
    now: new Date(),
  });

  // Extract points that have anomaly markers
  const anomalies = series.history
    .filter((p) => p.anomaly != null)
    .map((p) => {
      const key = p.anomaly as AnomalyKey;
      const detail = ANOMALY_DETAILS[key];
      return {
        id: `${key}-${p.t.getTime()}`,
        t: p.t.toISOString(),
        severity: detail.sev,
        title: detail.title,
        asset: "System total",
        description: detail.desc,
        predicted: +p.predicted.toFixed(2),
        actual: +p.actual.toFixed(2),
        factors: detail.factors,
      };
    });

  return Response.json(anomalies);
}
