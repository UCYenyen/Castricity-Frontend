"use client";
import { useMemo, useState } from "react";
import { useLiveClock } from "@/hooks/use-live-clock";
import { useLiveStream } from "@/hooks/use-live-stream";
import { fmtTime } from "@/lib/dashboard/format";
import type { LiveWindow } from "@/types/live";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveTopbar } from "./live-topbar";
import { LiveHeroMetrics } from "./live-hero-metrics";
import { LiveChart } from "./live-chart";
import { LiveAnomalyFeed } from "./live-anomaly-feed";
import { LiveMetricsPanel } from "./live-metrics-panel";
import { LiveWhatIfPanel } from "./live-whatif-panel";

export function LiveView() {
  const now = useLiveClock(1_000);
  const [window, setWindow] = useState<LiveWindow>(1);
  const { connected, ticks, metrics, anomalies, lastUpdate, reconnect } =
    useLiveStream({ window, enabled: true });

  const currentTick = ticks.length > 0 ? ticks[ticks.length - 1] : null;

  const demandSpark = useMemo(
    () => ticks.slice(-60).map((t) => t.actual),
    [ticks]
  );

  const errorSpark = useMemo(
    () => ticks.slice(-60).map((t) => Math.abs(t.deltaPct)),
    [ticks]
  );

  const ready = ticks.length > 0 && currentTick;

  return (
    <div className="flex flex-col min-w-0">
      <LiveTopbar
        now={now}
        connected={connected}
        lastUpdate={lastUpdate}
        onReconnect={reconnect}
      />

      <div className="flex flex-col min-w-0 px-5 py-4 sm:px-7 sm:py-5 gap-5">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight m-0">
              Live forecaster
            </h1>
            <div className="text-[13px] mt-1 text-muted-foreground">
              Real-time demand vs forecast · streaming every 3s ·{" "}
              <span className="mono ml-1 text-accent-cyan-2">SYS-00</span>
            </div>
          </div>
          <div className="mono text-[11px] flex items-center gap-1.5 text-muted-foreground">
            <span className={connected ? "pulse-dot" : "pulse-dot-red"} />
            {connected
              ? `Live · ${fmtTime(now)}`
              : "Disconnected"}
          </div>
        </div>

        {!ready && <LiveSkeleton />}

        {ready && (
          <>
            {/* Hero metrics row */}
            <LiveHeroMetrics
              currentTick={currentTick}
              ticks={ticks}
              metrics={metrics}
              demandSpark={demandSpark}
              errorSpark={errorSpark}
            />

            {/* Main content grid */}
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              {/* Live chart card */}
              <LiveChart
                ticks={ticks}
                window={window}
                onWindowChange={setWindow}
              />

              {/* Right side: metrics + anomalies */}
              <div className="flex flex-col gap-4">
                <LiveMetricsPanel metrics={metrics} />
                <LiveAnomalyFeed anomalies={anomalies} />
              </div>
            </div>

            {/* What-if panel */}
            <LiveWhatIfPanel />

            {/* Footer */}
            <div className="mono text-[11px] text-center py-3 text-text-faint tracking-[0.04em]">
              CASTRICITY · live forecaster · {ticks.length} ticks buffered ·
              {" "}stream latency ~3s · {fmtTime(now)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LiveSkeleton() {
  return (
    <>
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </>
  );
}
