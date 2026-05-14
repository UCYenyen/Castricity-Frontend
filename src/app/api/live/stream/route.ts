import { generateLiveAnomalies, generateLiveMetrics, generateLiveTick } from "@/lib/live/data";

export const dynamic = "force-dynamic";

/**
 * SSE endpoint that streams live ticks, metrics and anomaly events.
 * The client connects via `EventSource` and receives JSON-serialised
 * events every 3 seconds (tick), 15 seconds (metrics), and whenever
 * a new anomaly fires.
 *
 * In production, replace the synthetic generators with calls to the
 * Python inference backend (e.g. `fetch("http://localhost:8000/stream")`).
 */
export async function GET(): Promise<Response> {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      /* ── helper: push one SSE frame ── */
      function push(event: string, data: unknown): void {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // stream may have been closed by the client
          closed = true;
        }
      }

      /* ── heartbeat every 10s to keep connection alive ── */
      const heartbeat = setInterval(() => {
        push("heartbeat", { ts: new Date().toISOString() });
      }, 10_000);

      /* ── tick every 3s ── */
      const tickInterval = setInterval(() => {
        const tick = generateLiveTick(new Date());
        push("tick", {
          t: tick.t.toISOString(),
          actual: tick.actual,
          predicted: tick.predicted,
          delta: tick.delta,
          delta_pct: tick.deltaPct,
        });
      }, 3_000);

      /* ── metrics every 15s ── */
      const metricsInterval = setInterval(() => {
        const m = generateLiveMetrics();
        push("metrics", m);
      }, 15_000);

      /* ── anomaly check every 30s ── */
      const anomalyInterval = setInterval(() => {
        const anomalies = generateLiveAnomalies();
        for (const a of anomalies) {
          push("anomaly", {
            id: a.id,
            t: a.t.toISOString(),
            severity: a.severity,
            title: a.title,
            asset: a.asset,
            description: a.description,
            delta: a.delta,
            factors: a.factors,
          });
        }
      }, 30_000);

      /* ── send initial burst ── */
      const tick0 = generateLiveTick(new Date());
      push("tick", {
        t: tick0.t.toISOString(),
        actual: tick0.actual,
        predicted: tick0.predicted,
        delta: tick0.delta,
        delta_pct: tick0.deltaPct,
      });
      const m0 = generateLiveMetrics();
      push("metrics", m0);

      const anom0 = generateLiveAnomalies();
      for (const a of anom0) {
        push("anomaly", {
          id: a.id,
          t: a.t.toISOString(),
          severity: a.severity,
          title: a.title,
          asset: a.asset,
          description: a.description,
          delta: a.delta,
          factors: a.factors,
        });
      }

      /* ── cleanup on cancel ── */
      const cleanup = () => {
        closed = true;
        clearInterval(heartbeat);
        clearInterval(tickInterval);
        clearInterval(metricsInterval);
        clearInterval(anomalyInterval);
      };

      // ReadableStream cancel hook
      (controller as unknown as { signal?: AbortSignal }).signal?.addEventListener(
        "abort",
        cleanup,
        { once: true }
      );
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
