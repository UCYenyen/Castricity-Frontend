"use client";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useLiveClock } from "@/hooks/use-live-clock";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useTweaks } from "@/hooks/use-tweaks";
import { fmtTime } from "@/lib/dashboard/format";
import type {
  BrushRange, ExplainerPoint, ForecastHorizon, ForecastPoint,
  Metrics,
} from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardTopbar } from "./topbar";
import { HeroMetrics } from "./hero-metrics";
import { AnomalyStrip } from "./anomaly-strip";
import { ValidationCard } from "./validation-card";
import { ForecastCard } from "./forecast-card";
import { Explainer } from "./explainer";

const ACCENT_HEX: Record<string, string> = {
  cyan: "#06B6D4",
  green: "#10B981",
  amber: "#F59E0B",
  violet: "#8B5CF6",
};

function pickPeakTrough(future: ForecastPoint[]): {
  peak: ForecastPoint | null;
  trough: ForecastPoint | null;
} {
  const next24 = future.slice(0, 24);
  if (next24.length === 0) return { peak: null, trough: null };
  const peak = next24.reduce((m, p) => (p.predicted > m.predicted ? p : m), next24[0]);
  const trough = next24.reduce((m, p) => (p.predicted < m.predicted ? p : m), next24[0]);
  return { peak, trough };
}

export function DashboardView() {
  const now = useLiveClock(30_000);
  const [tweaks, setTweak] = useTweaks();
  const [futureHours, setFutureHours] = useState<ForecastHorizon>(48);
  const [brush, setBrush] = useState<BrushRange>([0, 1]);
  const [explainPt, setExplainPt] = useState<ExplainerPoint | null>(null);
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const futureDays = Math.max(1, Math.ceil(futureHours / 24));
  const { data, loading, refreshing, error, refresh } = useDashboardData({
    futureDays,
  });

  const rangeBounds = useMemo(() => {
    const h = data?.history ?? [];
    if (h.length === 0) return undefined;
    return { min: h[0].t, max: h[h.length - 1].t };
  }, [data?.history]);

  const filteredHistory = useMemo(() => {
    const h = data?.history ?? [];
    if (!range?.from) return h;
    const fromMs = range.from.setHours(0, 0, 0, 0);
    const toMs = (range.to ?? range.from);
    const toEnd = new Date(toMs).setHours(23, 59, 59, 999);
    return h.filter((p) => {
      const t = p.t.getTime();
      return t >= fromMs && t <= toEnd;
    });
  }, [data?.history, range]);

  const accent = ACCENT_HEX[tweaks.accent] ?? ACCENT_HEX.cyan;

  const futureSlice = useMemo<ForecastPoint[]>(
    () => (data?.future ?? []).slice(0, futureHours),
    [data?.future, futureHours]
  );

  const slicedHist = useMemo(() => {
    const h = data?.history ?? [];
    if (h.length === 0) return h;
    const i0 = Math.floor(brush[0] * (h.length - 1));
    const i1 = Math.ceil(brush[1] * (h.length - 1));
    return h.slice(i0, i1 + 1);
  }, [data?.history, brush]);

  const metrics: Metrics =
    data?.metrics ?? { mae: 0, rmse: 0, mape: 0, bias: 0, hit: 0 };

  const onRangeChange = (r: DateRange | undefined) => {
    setRange(r);
    setBrush([0, 1]);
  };

  const padding = tweaks.density === "compact" ? "16px 20px 40px" : "24px 28px 64px";
  const gap = tweaks.density === "compact" ? "14px" : "20px";

  const { peak, trough } = pickPeakTrough(futureSlice);

  const ready = data && data.history.length > 0 && data.future.length > 0 && peak && trough;

  return (
    <div className="flex flex-col min-w-0">
      <DashboardTopbar
        now={now}
        onRefresh={refresh}
        refreshing={refreshing}
      />
      <div className="flex flex-col min-w-0" style={{ padding, gap }}>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight m-0">
              Dasbor operasional
            </h1>
          </div>
          <div className="mono text-[11px] flex items-center gap-1.5 text-muted-foreground">
            <span className="pulse-dot" />
            {error ? "Terputus" : refreshing ? "Memperbarui…" : `Diperbarui ${fmtTime(now)}`}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-red-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Gagal memuat data dasbor</div>
              <div className="mono mt-1 text-[12px] text-red-300/80">{error}</div>
            </div>
          </div>
        )}

        {loading && !data && <DashboardSkeleton />}

        {ready && (
          <>
            <HeroMetrics
              history={data.history}
              future={futureSlice}
              peak={peak}
              metrics={metrics}
            />

            <AnomalyStrip
              anomalies={data.anomalies}
              onSelect={(a) => setExplainPt(a.point)}
            />

            <div className="grid gap-4 grid-cols-1">
              <ValidationCard
                history={filteredHistory}
                metrics={metrics}
                range={range}
                onRangeChange={onRangeChange}
                rangeBounds={rangeBounds}
                accent={accent}
                brush={brush}
                onBrush={setBrush}
                errorAsPct={tweaks.errorAsPct}
                onErrorAsPct={(v) => setTweak("errorAsPct", v)}
                onPointClick={(p) =>
                  setExplainPt({
                    t: p.t,
                    actual: p.actual,
                    predicted: p.predicted,
                    anomalyKey: null,
                  })
                }
                slicedCount={slicedHist.length}
              />
              {/* <ForecastCard
                history={data.history}
                future={futureSlice}
                peak={peak}
                trough={trough}
                futureHours={futureHours}
                onFutureHours={setFutureHours}
                accent={accent}
                showBand={tweaks.showBand}
                onShowBand={(v) => setTweak("showBand", v)}
                showHistOnForecast={tweaks.showHistoryOnForecast}
                onShowHistOnForecast={(v) => setTweak("showHistoryOnForecast", v)}
                now={now}
                onPointClick={setExplainPt}
              /> */}
            </div>

            {explainPt && <Explainer point={explainPt} onClose={() => setExplainPt(null)} />}

            <div className="mono text-[11px] text-center py-3 text-text-faint tracking-[0.04em]">
              CASTRICITY · dasbor operasional · {data.history.length} obs ·{" "}
              {futureSlice.length} titik peramalan · pembaruan terakhir {fmtTime(now)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-18 rounded-xl" />
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Skeleton className="h-130 rounded-xl" />
        <Skeleton className="h-130 rounded-xl" />
      </div>
    </>
  );
}
