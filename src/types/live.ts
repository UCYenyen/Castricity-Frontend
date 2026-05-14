import type { ExplainerFactor, Severity } from "./dashboard";

/* ───── Live tick from SSE stream ───── */
export interface LiveTick {
  readonly t: Date;
  readonly actual: number;
  readonly predicted: number;
  readonly delta: number;
  readonly deltaPct: number;
}

/* ───── Wire format (JSON from SSE / API) ───── */
export interface ApiLiveTick {
  readonly t: string;
  readonly actual: number;
  readonly predicted: number;
  readonly delta: number;
  readonly delta_pct: number;
}

/* ───── Real-time rolling metrics ───── */
export interface LiveMetrics {
  readonly mae: number;
  readonly rmse: number;
  readonly mape: number;
  readonly bias: number;
  readonly hit: number;
  readonly trend: "improving" | "stable" | "degrading";
}

export interface ApiLiveMetrics {
  readonly mae: number;
  readonly rmse: number;
  readonly mape: number;
  readonly bias: number;
  readonly hit: number;
  readonly trend: "improving" | "stable" | "degrading";
}

/* ───── Live anomaly alert ───── */
export interface LiveAnomaly {
  readonly id: string;
  readonly t: Date;
  readonly severity: Severity;
  readonly title: string;
  readonly asset: string;
  readonly description: string;
  readonly delta: number;
  readonly factors: ExplainerFactor[];
}

export interface ApiLiveAnomaly {
  readonly id: string;
  readonly t: string;
  readonly severity: Severity;
  readonly title: string;
  readonly asset: string;
  readonly description: string;
  readonly delta: number;
  readonly factors: ExplainerFactor[];
}

/* ───── SSE envelope ───── */
export type LiveEventType = "tick" | "metrics" | "anomaly" | "heartbeat";

export interface LiveSSEEvent {
  readonly type: LiveEventType;
  readonly data: ApiLiveTick | ApiLiveMetrics | ApiLiveAnomaly | null;
}

/* ───── Composite live state ───── */
export interface LiveState {
  readonly connected: boolean;
  readonly ticks: LiveTick[];
  readonly metrics: LiveMetrics | null;
  readonly anomalies: LiveAnomaly[];
  readonly lastUpdate: Date | null;
}

/* ───── What-if scenario inputs ───── */
export interface LiveWhatIfInput {
  readonly target_date: string;
  readonly avg_temp: number;
  readonly rainfall: number;
  readonly is_holiday: boolean;
}

export interface LiveWhatIfResult {
  readonly predicted: number;
  readonly baseline: number;
  readonly delta: number;
  readonly factors: ExplainerFactor[];
}

/* ───── Time range selector ───── */
export type LiveWindow = 1 | 6 | 12 | 24;
