"use client";
import { useState } from "react";
import { runWhatIf } from "@/lib/api";
import { fmtMW, fmtSigned } from "@/lib/dashboard/format";
import type { ApiWhatIfResult } from "@/types/api";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FlaskConical, Loader2 } from "lucide-react";

export function WhatIfPanel() {
  const [temp, setTemp] = useState(28);
  const [rain, setRain] = useState(0);
  const [holiday, setHoliday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiWhatIfResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await runWhatIf({
        target_date: new Date(Date.now() + 86_400_000).toISOString(),
        avg_temp: temp,
        rainfall: rain,
        is_holiday: holiday,
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "What-if failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FlaskConical size={14} className="text-accent-purple" />
          What-if scenario
        </CardTitle>
        <CardDescription className="text-text-muted text-xs">
          Adjust parameters and simulate demand impact
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Avg temperature (°C)
            </Label>
            <Input
              type="number"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className="mono text-sm h-9"
              min={-10}
              max={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Rainfall (mm)
            </Label>
            <Input
              type="number"
              value={rain}
              onChange={(e) => setRain(Number(e.target.value))}
              className="mono text-sm h-9"
              min={0}
              max={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Public holiday
            </Label>
            <div className="flex items-center gap-2 h-9">
              <Switch checked={holiday} onCheckedChange={setHoliday} />
              <span className="text-xs text-text-secondary">
                {holiday ? "Yes" : "No"}
              </span>
            </div>
          </div>
          <Button onClick={handleRun} disabled={loading} className="h-9">
            {loading ? (
              <Loader2 size={14} className="animate-spin mr-1.5" />
            ) : (
              <FlaskConical size={14} className="mr-1.5" />
            )}
            Run scenario
          </Button>
        </div>

        {error && (
          <div className="mt-3 text-xs text-accent-red mono">{error}</div>
        )}

        {result && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ResultCard
              label="Predicted demand"
              value={`${fmtMW(result.predicted)} MW`}
              accent="text-accent-cyan-2"
            />
            <ResultCard
              label="Baseline"
              value={`${fmtMW(result.baseline)} MW`}
              accent="text-text-secondary"
            />
            <ResultCard
              label="Delta"
              value={`${fmtSigned(result.delta, 0)} MW`}
              accent={
                result.delta > 0 ? "text-accent-red" : "text-accent-green"
              }
            />
          </div>
        )}

        {result?.factors && result.factors.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {result.factors.map((f, i) => (
              <div
                key={i}
                className="grid items-center gap-2.5 text-[11.5px]"
                style={{ gridTemplateColumns: "120px 1fr 56px" }}
              >
                <div className="text-text-secondary">{f.k}</div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-muted-foreground/10">
                  <i
                    className="absolute inset-y-0"
                    style={{
                      width: `${f.w * 50}%`,
                      left: f.sign < 0 ? `${50 - f.w * 50}%` : "50%",
                      background:
                        f.sign < 0
                          ? "var(--accent-red)"
                          : "var(--accent-cyan)",
                    }}
                  />
                </div>
                <div className="mono text-right">{f.v}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResultCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-popover/55 px-3.5 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className={`mono mt-1 text-lg font-semibold ${accent}`}>
        {value}
      </div>
    </div>
  );
}
