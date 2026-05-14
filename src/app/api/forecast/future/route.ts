import { NextRequest } from "next/server";
import { buildSeries } from "@/lib/dashboard/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const days = Math.max(1, parseInt(searchParams.get("days") ?? "7", 10) || 7);
  const futureHours = days * 24;

  const series = buildSeries({
    regionId: "sys",
    historyHours: 24,
    futureHours,
    now: new Date(),
  });

  const payload = series.future.map((p) => ({
    t: p.t.toISOString(),
    predicted: +p.predicted.toFixed(2),
    p10: +p.p10.toFixed(2),
    p90: +p.p90.toFixed(2),
  }));

  return Response.json(payload);
}
