"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiLiveTickSchema,
  apiLiveMetricsSchema,
  apiLiveAnomalySchema,
} from "@/validations/live";
import type {
  LiveAnomaly,
  LiveMetrics,
  LiveState,
  LiveTick,
  LiveWindow,
} from "@/types/live";

const MAX_TICKS = 720; // 1h of 5-second ticks ≈ 720 points max
const MAX_ANOMALIES = 50;

interface UseLiveStreamArgs {
  /** Hours of ticks to keep in the buffer */
  window?: LiveWindow;
  /** Whether the stream is enabled */
  enabled?: boolean;
}

export function useLiveStream({
  window = 1,
  enabled = true,
}: UseLiveStreamArgs = {}): LiveState & {
  reconnect: () => void;
} {
  const [connected, setConnected] = useState(false);
  const [ticks, setTicks] = useState<LiveTick[]>([]);
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<LiveAnomaly[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const windowMs = window * 3_600_000;

  const connect = useCallback(() => {
    // Close any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (!enabled) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";
    const es = new EventSource(`${apiUrl}/live/stream`);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => {
      setConnected(false);
      // Auto-reconnect is built into EventSource
    };

    es.addEventListener("tick", (e: MessageEvent) => {
      try {
        const parsed = apiLiveTickSchema.parse(JSON.parse(e.data));
        const tick: LiveTick = {
          t: new Date(parsed.t),
          actual: parsed.actual,
          predicted: parsed.predicted,
          delta: parsed.delta,
          deltaPct: parsed.delta_pct,
        };
        setTicks((prev) => {
          const cutoff = Date.now() - windowMs;
          const filtered = prev.filter((t) => t.t.getTime() > cutoff);
          const next = [...filtered, tick];
          return next.length > MAX_TICKS ? next.slice(-MAX_TICKS) : next;
        });
        setLastUpdate(tick.t);
      } catch {
        // skip malformed events
      }
    });

    es.addEventListener("metrics", (e: MessageEvent) => {
      try {
        const parsed = apiLiveMetricsSchema.parse(JSON.parse(e.data));
        setMetrics(parsed);
      } catch {
        // skip
      }
    });

    es.addEventListener("anomaly", (e: MessageEvent) => {
      try {
        const parsed = apiLiveAnomalySchema.parse(JSON.parse(e.data));
        const anomaly: LiveAnomaly = {
          ...parsed,
          t: new Date(parsed.t),
        };
        setAnomalies((prev) => {
          // deduplicate by id
          const exists = prev.some((a) => a.id === anomaly.id);
          if (exists) return prev;
          const next = [anomaly, ...prev];
          return next.length > MAX_ANOMALIES
            ? next.slice(0, MAX_ANOMALIES)
            : next;
        });
      } catch {
        // skip
      }
    });

    es.addEventListener("heartbeat", () => {
      setConnected(true);
    });
  }, [enabled, windowMs]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect]);

  // Trim ticks when window changes
  useEffect(() => {
    setTicks((prev) => {
      const cutoff = Date.now() - windowMs;
      return prev.filter((t) => t.t.getTime() > cutoff);
    });
  }, [windowMs]);

  return {
    connected,
    ticks,
    metrics,
    anomalies,
    lastUpdate,
    reconnect: connect,
  };
}
