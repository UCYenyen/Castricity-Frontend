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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, CalendarIcon, Loader2, TrendingUp } from "lucide-react";
import { fmtMW } from "@/lib/dashboard/format";
import { MultiHorizonChart } from "./multi-horizon-chart";
import { WhatIfPanel } from "./whatif-panel";

const HORIZON_PRESETS = [
  { v: 7, l: "7 hari" },
  { v: 30, l: "30 hari" },
  { v: 90, l: "90 hari" },
  { v: 180, l: "180 hari" },
  { v: 365, l: "1 tahun" },
  { v: 730, l: "2 tahun" },
] as const;

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d: Date) => `${d.getDate()} ${MONTH[d.getMonth()]} ${d.getFullYear()}`;
const today = () => new Date(new Date().setHours(0, 0, 0, 0));

export function ForecastView() {
  const [horizon, setHorizon] = useState<number>(30);
  const [startDate, setStartDate] = useState<Date>(today());
  const [showBand, setShowBand] = useState(true);
  const [future, setFuture] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ForecastPoint | null>(null);

  const fetchFuture = useCallback(
    async (days: number, start: Date, signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getFuture({
          days,
          startDate: start.toISOString().slice(0, 10),
          signal,
        });
        if (signal.aborted) return;
        setFuture(data);
        setSelected(data[0] ?? null);
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        setError(e instanceof ApiError ? e.message : "Gagal memuat peramalan");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchFuture(horizon, startDate, ctrl.signal);
    return () => ctrl.abort();
  }, [horizon, startDate, fetchFuture]);

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
            Proyeksi hybrid Prophet + LightGBM. Klik satu hari pada grafik untuk memuat ke panel bagaimana-jika.
          </p>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Mulai dari
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="mono h-9 w-40 justify-start gap-2 text-xs">
                  <CalendarIcon size={14} />
                  {fmtDate(startDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  defaultMonth={startDate}
                  captionLayout="dropdown"
                  startMonth={new Date(2024, 0, 1)}
                  endMonth={new Date(2050, 11, 31)}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
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
                <SelectValue placeholder="Kustom" />
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
              Kustom (hari)
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
              Pita keyakinan
            </Label>
            <div className="flex items-center gap-2 h-9">
              <Switch checked={showBand} onCheckedChange={setShowBand} />
              <span className="text-xs text-text-secondary">{showBand ? "Aktif" : "Nonaktif"}</span>
            </div>
          </div>
        </div>
      </header>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryTile label="Puncak (MW)" value={fmtMW(summary.peak.predicted)} accent="text-accent-red" />
          <SummaryTile label="Rata-rata (MW)" value={fmtMW(summary.avg)} accent="text-foreground" />
          <SummaryTile label="Lembah (MW)" value={fmtMW(summary.trough.predicted)} accent="text-accent-green" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertTitle>Gagal memuat peramalan</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Trajektori peramalan · {horizon} hari ke depan
            {bounds && (
              <span className="mono ml-2 text-[11px] font-normal text-text-muted">
                ({bounds.min.toISOString().slice(0, 10)} → {bounds.max.toISOString().slice(0, 10)})
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-text-muted text-xs">
            Mulai dari {fmtDate(startDate)}. Arahkan kursor untuk nilai harian, klik untuk mengunci tanggal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-90 w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center text-text-muted text-xs">
                <Loader2 size={14} className="mr-2 animate-spin" />
                Memuat peramalan…
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
