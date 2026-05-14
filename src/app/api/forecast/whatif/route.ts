import { NextRequest } from "next/server";
import { buildSeries } from "@/lib/dashboard/data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { target_date, avg_temp, rainfall, is_holiday } = body;

  const targetDate = new Date(target_date);
  const series = buildSeries({
    regionId: "sys",
    historyHours: 24,
    futureHours: 48,
    now: targetDate,
  });

  const baseline = series.future[0]?.predicted ?? 5000;

  // Simple synthetic what-if adjustments
  let delta = 0;
  delta += (avg_temp - 25) * 18; // ~18 MW per degree above 25
  delta += rainfall * -4;        // rain reduces demand slightly
  if (is_holiday) delta -= 350;  // holiday reduces demand

  const predicted = baseline + delta;

  const factors = [
    { k: "Temperature", v: `${delta > 0 ? "+" : ""}${((avg_temp - 25) * 18).toFixed(0)} MW`, w: 0.5, sign: (avg_temp >= 25 ? 1 : -1) as -1 | 0 | 1 },
    { k: "Rainfall", v: `${(rainfall * -4).toFixed(0)} MW`, w: 0.2, sign: (rainfall > 0 ? -1 : 0) as -1 | 0 | 1 },
    { k: "Holiday", v: is_holiday ? "-350 MW" : "0 MW", w: is_holiday ? 0.25 : 0, sign: (is_holiday ? -1 : 0) as -1 | 0 | 1 },
    { k: "Baseline", v: `${baseline.toFixed(0)} MW`, w: 0.05, sign: 1 as const },
  ];

  return Response.json({
    predicted: +predicted.toFixed(2),
    baseline: +baseline.toFixed(2),
    delta: +delta.toFixed(2),
    factors,
  });
}
