export type Severity = "critical" | "warning" | "info";

export type AnomalyKey = "heatwave" | "solar-drop";

export interface Region {
  id: string;
  name: string;
  peak: number;
  base: number;
  code: string;
}

export interface HistoryPoint {
  t: Date;
  actual: number;
  predicted: number;
  anomaly?: AnomalyKey | null;
}

export interface ForecastPoint {
  t: Date;
  predicted: number;
  p10: number;
  p90: number;
  actual?: undefined;
}

export type SeriesPoint = HistoryPoint | ForecastPoint;

export interface Series {
  region: Region;
  history: HistoryPoint[];
  future: ForecastPoint[];
  peak: ForecastPoint;
  trough: ForecastPoint;
}

export interface Metrics {
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  hit: number;
}

export interface ExplainerFactor {
  k: string;
  v: string;
  w: number;
  sign: -1 | 0 | 1;
}

export interface ExplainerData {
  title: string;
  sev: Severity;
  desc: string;
  factors: ExplainerFactor[];
}

export interface AnomalyDetail extends ExplainerData {}

export interface AnomalyEntry {
  sev: Severity;
  title: string;
  asset: string;
  timeAgo: string;
  point: ExplainerPoint;
}

export interface ExplainerPoint {
  t: Date;
  actual?: number;
  predicted: number;
  p10?: number;
  p90?: number;
  anomalyKey?: AnomalyKey | null;
  data?: ExplainerData;
}

export type AccentName = "cyan" | "green" | "amber" | "violet";

export interface Tweaks {
  accent: AccentName;
  density: "compact" | "comfy";
  showBand: boolean;
  showHistoryOnForecast: boolean;
  errorAsPct: boolean;
}

export type HistoryWindow = 24 | 72 | 168 | 720;
export type ForecastHorizon = 24 | 48 | 72 | 168;

export type BrushRange = readonly [number, number];
