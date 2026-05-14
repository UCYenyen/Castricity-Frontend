"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getAnomalies,
  getFuture,
  getHistorical,
  getMetrics,
} from "@/lib/api";
import type {
  AnomalyEntry,
  ForecastPoint,
  HistoryPoint,
  Metrics,
} from "@/types/dashboard";

export interface DashboardData {
  history: HistoryPoint[];
  future: ForecastPoint[];
  anomalies: AnomalyEntry[];
  metrics: Metrics | null;
}

interface UseDashboardDataArgs {
  historyHours: number;
  futureDays: number;
  autoTickMs?: number;
}

interface UseDashboardDataResult {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboardData({
  historyHours,
  futureDays,
  autoTickMs = 60_000,
}: UseDashboardDataArgs): UseDashboardDataResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(
    async (signal: AbortSignal, isRefresh: boolean) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [historyAll, future, anomalies, metrics] = await Promise.all([
          getHistorical({ signal }),
          getFuture({ days: futureDays, signal }),
          getAnomalies(signal),
          getMetrics(signal).catch(() => null),
        ]);
        if (signal.aborted) return;
        const days = Math.max(1, Math.ceil(historyHours / 24));
        const history = historyAll.slice(-days);
        setData({ history, future, anomalies, metrics });
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        const msg = e instanceof ApiError ? e.message : "Failed to load dashboard data";
        setError(msg);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [historyHours, futureDays]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchAll(ctrl.signal, false);
    return () => ctrl.abort();
  }, [fetchAll]);

  useEffect(() => {
    if (!autoTickMs) return;
    const id = setInterval(() => {
      const ctrl = new AbortController();
      fetchAll(ctrl.signal, true);
    }, autoTickMs);
    return () => clearInterval(id);
  }, [fetchAll, autoTickMs]);

  const refresh = useCallback(() => {
    const ctrl = new AbortController();
    fetchAll(ctrl.signal, true);
  }, [fetchAll]);

  return { data, loading, refreshing, error, refresh };
}
