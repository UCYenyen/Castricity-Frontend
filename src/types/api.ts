import type { ExplainerFactor, Severity } from "./dashboard";

export interface ApiHistoricalPoint {
  t: string;
  actual: number;
  predicted: number;
  anomaly?: string | null;
}

export interface ApiFuturePoint {
  t: string;
  predicted: number;
  p10: number;
  p90: number;
}

export interface ApiMetrics {
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  hit: number;
}

export interface ApiAnomaly {
  id?: string;
  t: string;
  severity: Severity;
  title: string;
  asset: string;
  description?: string;
  predicted?: number;
  actual?: number;
  factors: ExplainerFactor[];
}

export interface ApiWhatIfPayload {
  target_date: string;
  avg_temp: number;
  rainfall: number;
  is_holiday: boolean;
}

export interface ApiWhatIfResult {
  predicted: number;
  baseline: number;
  delta: number;
  factors?: ExplainerFactor[];
}
