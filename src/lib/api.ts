import { z } from "zod";
import {
  apiAnomaliesSchema,
  apiFutureSchema,
  apiHistoricalSchema,
  apiMetricsSchema,
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
import type { ApiAnomaly, ApiWhatIfResult } from "@/types/api";

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
  return fetchJson("/metrics", apiMetricsSchema, { signal });
}

export async function getHistorical(
  args: { start?: string; end?: string; signal?: AbortSignal } = {}
): Promise<HistoryPoint[]> {
  const qs = new URLSearchParams();
  if (args.start) qs.set("start", args.start);
  if (args.end) qs.set("end", args.end);
  const path = `/forecast/historical${qs.toString() ? `?${qs}` : ""}`;
  const raw = await fetchJson(path, apiHistoricalSchema, { signal: args.signal });
  return raw.map((p) => ({
    t: new Date(p.t),
    actual: p.actual,
    predicted: p.predicted,
    anomaly: (p.anomaly ?? null) as HistoryPoint["anomaly"],
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
    t: new Date(p.t),
    predicted: p.predicted,
    p10: p.p10,
    p90: p.p90,
  }));
}

export async function getAnomalies(
  signal?: AbortSignal
): Promise<AnomalyEntry[]> {
  const raw = await fetchJson("/anomalies", apiAnomaliesSchema, { signal });
  const now = Date.now();
  return raw.map((a: ApiAnomaly): AnomalyEntry => {
    const t = new Date(a.t);
    const ageMs = now - t.getTime();
    const inFuture = ageMs < 0;
    const hours = Math.round(Math.abs(ageMs) / 3_600_000);
    const data: ExplainerData = {
      title: a.title,
      sev: a.severity,
      desc: a.description ?? "",
      factors: a.factors,
    };
    return {
      sev: a.severity,
      title: a.title,
      asset: a.asset,
      timeAgo: inFuture ? `in ${hours}h` : `${hours}h ago`,
      point: {
        t,
        actual: a.actual,
        predicted: a.predicted ?? a.actual ?? 0,
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
  const body = whatIfPayloadSchema.parse(payload);
  return fetchJson("/forecast/whatif", apiWhatIfResultSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}
