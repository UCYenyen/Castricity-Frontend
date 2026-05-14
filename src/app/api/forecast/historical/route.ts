import { NextRequest } from "next/server";
import { buildSeries } from "@/lib/dashboard/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  const end = endStr ? new Date(endStr) : new Date();
  const start = startStr ? new Date(startStr) : new Date(end.getTime() - 168 * 3_600_000);

  const historyHours = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3_600_000));

  const series = buildSeries({
    regionId: "sys",
    historyHours,
    futureHours: 48,
    now: end,
  });

  const payload = series.history.map((p) => ({
    t: p.t.toISOString(),
    actual: +p.actual.toFixed(2),
    predicted: +p.predicted.toFixed(2),
    anomaly: p.anomaly ?? null,
  }));

  return Response.json(payload);
}
