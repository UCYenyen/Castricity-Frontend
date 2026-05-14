import { z } from "zod";
import {
  apiAnomaliesSchema,
  apiFeatureImportanceListSchema,
  apiFeaturesResponseSchema,
  apiFutureSchema,
  apiHistoricalSchema,
  apiMetricsSchema,
  apiRequiredFeaturesSchema,
  apiWhatIfResultSchema,
  whatIfPayloadSchema,
  type WhatIfPayloadInput,
} from "@/validations/api";
import type {
  AnomalyEntry,
  ExplainerData,
  ForecastPoint,
  HistoryPoint,
  Metrics,
} from "@/types/dashboard";
import type {
  ApiFeatureImportance,
  ApiFeatureInfo,
  ApiFeaturesResponse,
  ApiWhatIfResult,
} from "@/types/api";

const API = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchJson<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Promise<T> {
  if (!API) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL is not configured. Set it in .env.local."
    );
  }
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new ApiError(`Request failed: ${path}`, res.status);
  }
  const json = await res.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(
      `Invalid response shape for ${path}: ${parsed.error.message}`
    );
  }
  return parsed.data;
}

export async function getMetrics(signal?: AbortSignal): Promise<Metrics> {
  const raw = await fetchJson("/metrics", apiMetricsSchema, { signal });
  return {
    mae: raw.mae,
    rmse: raw.rmse,
    mape: raw.mape,
    bias: 0,
    hit: raw.r2,
  };
}

export async function getHistorical(
  args: { start?: string; end?: string; signal?: AbortSignal } = {}
): Promise<HistoryPoint[]> {
  const qs = new URLSearchParams();
  if (args.start) qs.set("start", args.start.slice(0, 10));
  if (args.end) qs.set("end", args.end.slice(0, 10));
  const path = `/forecast/historical${qs.toString() ? `?${qs}` : ""}`;
  const raw = await fetchJson(path, apiHistoricalSchema, { signal: args.signal });
  return raw.map((p) => ({
    t: new Date(p.date),
    actual: p.actual,
    predicted: p.predicted,
    anomaly: null,
  }));
}

export async function getFuture(
  args: { days?: number; signal?: AbortSignal } = {}
): Promise<ForecastPoint[]> {
  const days = args.days ?? 7;
  const raw = await fetchJson(
    `/forecast/future?days=${days}`,
    apiFutureSchema,
    { signal: args.signal }
  );
  return raw.map((p) => ({
    t: new Date(p.date),
    predicted: p.predicted,
    p10: p.lower_bound,
    p90: p.upper_bound,
  }));
}

export async function getAnomalies(
  signal?: AbortSignal
): Promise<AnomalyEntry[]> {
  const raw = await fetchJson("/anomalies", apiAnomaliesSchema, { signal });
  const now = Date.now();
  return raw.map((a): AnomalyEntry => {
    const t = new Date(a.date);
    const ageMs = now - t.getTime();
    const days = Math.round(Math.abs(ageMs) / 86_400_000);
    const inFuture = ageMs < 0;
    const dev = a.deviation_pct ?? 0;
    const sign: -1 | 0 | 1 = dev > 0 ? 1 : dev < 0 ? -1 : 0;
    const predicted = dev !== 0 ? a.value / (1 + dev / 100) : a.value;
    const factors = [
      {
        k: "Deviation",
        v: `${dev >= 0 ? "+" : ""}${dev.toFixed(2)}%`,
        w: Math.min(1, Math.abs(dev) / 30),
        sign,
      },
      ...(a.score != null
        ? [{ k: "IF score", v: a.score.toFixed(4), w: Math.min(1, Math.abs(a.score) * 100), sign: -1 as const }]
        : []),
    ];
    const data: ExplainerData = {
      title: "Demand anomaly",
      sev: a.severity,
      desc: `Actual demand deviated ${dev >= 0 ? "above" : "below"} the model by ${Math.abs(dev).toFixed(2)}%.`,
      factors,
    };
    return {
      sev: a.severity,
      title: "Demand anomaly",
      asset: "National grid",
      timeAgo: inFuture ? `in ${days}d` : `${days}d ago`,
      point: {
        t,
        actual: a.value,
        predicted,
        anomalyKey: null,
        data,
      },
    };
  });
}

export async function runWhatIf(
  payload: WhatIfPayloadInput,
  signal?: AbortSignal
): Promise<ApiWhatIfResult> {
  const body = whatIfPayloadSchema.parse({
    ...payload,
    target_date: payload.target_date.slice(0, 10),
  });
  const raw = await fetchJson("/forecast/whatif", apiWhatIfResultSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  const maxAbs = Math.max(
    1e-6,
    ...raw.shap_contributions.map((c) => Math.abs(c.contribution))
  );
  const factors = [...raw.shap_contributions]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .map((c) => ({
      k: c.feature,
      v: `${c.contribution >= 0 ? "+" : ""}${c.contribution.toFixed(0)} MW`,
      w: Math.min(1, Math.abs(c.contribution) / maxAbs),
      sign: (c.contribution > 0 ? 1 : c.contribution < 0 ? -1 : 0) as -1 | 0 | 1,
    }));

  return {
    predicted: raw.predicted_mwh,
    baseline: raw.prophet_baseline,
    delta: raw.lgbm_residual,
    factors,
  };
}

export async function getFeatures(
  signal?: AbortSignal
): Promise<ApiFeaturesResponse> {
  return fetchJson("/features", apiFeaturesResponseSchema, { signal });
}

export async function getRequiredFeatures(
  signal?: AbortSignal
): Promise<ApiFeatureInfo[]> {
  return fetchJson("/features/required", apiRequiredFeaturesSchema, { signal });
}

export async function getFeatureImportance(
  signal?: AbortSignal
): Promise<ApiFeatureImportance[]> {
  return fetchJson("/features/importance", apiFeatureImportanceListSchema, {
    signal,
  });
}
