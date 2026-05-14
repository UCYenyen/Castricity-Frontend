import { buildSeries, computeMetrics } from "@/lib/dashboard/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const series = buildSeries({
    regionId: "sys",
    historyHours: 168,
    futureHours: 48,
    now: new Date(),
  });

  const metrics = computeMetrics(series.history);

  return Response.json({
    mae: +metrics.mae.toFixed(2),
    rmse: +metrics.rmse.toFixed(2),
    mape: +metrics.mape.toFixed(2),
    bias: +metrics.bias.toFixed(2),
    hit: +metrics.hit.toFixed(2),
  });
}
