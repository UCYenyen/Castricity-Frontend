"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getFeatures,
  getFeatureImportance,
} from "@/lib/api";
import type { ApiFeatureImportance, ApiFeatureInfo } from "@/types/api";

export interface FeatureDriversData {
  features: ApiFeatureInfo[];
  importance: ApiFeatureImportance[];
}

interface UseFeatureDriversResult {
  data: FeatureDriversData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFeatureDrivers(): UseFeatureDriversResult {
  const [data, setData] = useState<FeatureDriversData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(
    async (signal: AbortSignal, isRefresh: boolean) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [featRes, importance] = await Promise.all([
          getFeatures(signal),
          getFeatureImportance(signal),
        ]);
        if (signal.aborted) return;
        setData({ features: featRes.features, importance });
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        const msg =
          e instanceof ApiError
            ? e.message
            : "Gagal memuat data fitur";
        setError(msg);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchAll(ctrl.signal, false);
    return () => ctrl.abort();
  }, [fetchAll]);

  const refresh = useCallback(() => {
    const ctrl = new AbortController();
    fetchAll(ctrl.signal, true);
  }, [fetchAll]);

  return { data, loading, refreshing, error, refresh };
}
