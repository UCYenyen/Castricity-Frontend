"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, getFuture } from "@/lib/api";
import type { ForecastPoint } from "@/types/dashboard";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, TrendingUp } from "lucide-react";
import { fmtMW } from "@/lib/dashboard/format";
import { MultiHorizonChart } from "./multi-horizon-chart";
import { WhatIfPanel } from "./whatif-panel";

const HORIZON_PRESETS = [
  { v: 7, l: "7 days" },
  { v: 30, l: "30 days" },
  { v: 90, l: "90 days" },
  { v: 180, l: "180 days" },
  { v: 365, l: "1 year" },
  { v: 730, l: "2 years" },
] as const;

export function ForecastView() {
  const [horizon, setHorizon] = useState<number>(30);
  const [showBand, setShowBand] = useState(true);
  const [future, setFuture] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ForecastPoint | null>(null);

  const fetchFuture = useCallback(async (days: number, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFuture({ days, signal });
      if (signal.aborted) return;
      setFuture(data);
      setSelected((prev) => prev ?? data[0] ?? null);
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setError(e instanceof ApiError ? e.message : "Failed to load forecast");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchFuture(horizon, ctrl.signal);
    return () => ctrl.abort();
  }, [horizon, fetchFuture]);

  const summary = useMemo(() => {
    if (future.length === 0) return null;
    const preds = future.map((p) => p.predicted);
    const peak = future.reduce((a, b) => (b.predicted > a.predicted ? b : a));
    const trough = future.reduce((a, b) => (b.predicted < a.predicted ? b : a));
    const avg = preds.reduce((s, v) => s + v, 0) / preds.length;
    return { peak, trough, avg };
  }, [future]);

  const bounds = useMemo(() => {
    if (future.length === 0) return undefined;
    return { min: future[0].t, max: future[future.length - 1].t };
  }, [future]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <TrendingUp size={18} className="text-accent-cyan" />
            Multi-horizon forecast
          </h1>
          <p className="text-sm text-text-muted">
            Hybrid Prophet + LightGBM projection. Click a day on the chart to load it into the what-if panel.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Preset
            </Label>
            <Select
              value={
                HORIZON_PRESETS.some((o) => o.v === horizon) ? String(horizon) : ""
              }
              onValueChange={(v) => setHorizon(Number(v))}
            >
              <SelectTrigger className="h-9 w-32 text-xs">
                <SelectValue placeholder="Custom" />
              </SelectTrigger>
              <SelectContent>
                {HORIZON_PRESETS.map((o) => (
                  <SelectItem key={o.v} value={String(o.v)} className="text-xs">
                    {o.l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Custom (days)
            </Label>
            <Input
              type="number"
              value={horizon}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 1) setHorizon(Math.floor(n));
              }}
              min={1}
              step={1}
              className="mono h-9 w-28 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Confidence band
            </Label>
            <div className="flex items-center gap-2 h-9">
              <Switch checked={showBand} onCheckedChange={setShowBand} />
              <span className="text-xs text-text-secondary">{showBand ? "On" : "Off"}</span>
            </div>
          </div>
        </div>
      </header>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryTile label="Peak (MW)" value={fmtMW(summary.peak.predicted)} accent="text-accent-red" />
          <SummaryTile label="Average (MW)" value={fmtMW(summary.avg)} accent="text-foreground" />
          <SummaryTile label="Trough (MW)" value={fmtMW(summary.trough.predicted)} accent="text-accent-green" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertTitle>Couldn&apos;t load forecast</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Forecast trajectory · next {horizon} days
            {bounds && (
              <span className="mono ml-2 text-[11px] font-normal text-text-muted">
                ({bounds.min.toISOString().slice(0, 10)} → {bounds.max.toISOString().slice(0, 10)})
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-text-muted text-xs">
            Forecast starts the day after the training set ends ({bounds ? bounds.min.toISOString().slice(0, 10) : "—"}), not today.
            Hover for daily values, click to lock a date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-90 w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center text-text-muted text-xs">
                <Loader2 size={14} className="mr-2 animate-spin" />
                Loading forecast…
              </div>
            ) : (
              <MultiHorizonChart
                future={future}
                showBand={showBand}
                selectedT={selected?.t.getTime() ?? null}
                onSelect={setSelected}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <WhatIfPanel
        selectedDate={selected?.t}
        onDateChange={(d) => {
          const match = future.find((p) => p.t.toDateString() === d.toDateString());
          setSelected(match ?? { t: d, predicted: 0, p10: 0, p90: 0 });
        }}
        minDate={bounds?.min}
      />
    </div>
  );
}

function SummaryTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-border bg-popover/55 px-3.5 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mono mt-1 text-xl font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
