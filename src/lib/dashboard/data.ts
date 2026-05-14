import type {
  AnomalyDetail,
  AnomalyKey,
  ExplainerData,
  ExplainerPoint,
  ForecastPoint,
  HistoryPoint,
  Metrics,
  Region,
  Series,
} from "@/types/dashboard";

function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const REGIONS: Region[] = [
  { id: "sys", name: "System total", peak: 7842, base: 4900, code: "SYS-00" },
  { id: "north", name: "Northern Zone", peak: 2380, base: 1480, code: "ZN-NTH" },
  { id: "metro", name: "Metro / Capital", peak: 3120, base: 1980, code: "ZN-MTR" },
  { id: "coast", name: "Coastal Belt", peak: 1410, base: 860, code: "ZN-CST" },
  { id: "inland", name: "Inland Plains", peak: 932, base: 580, code: "ZN-INL" },
];

function curveShape(h: number): number {
  const morning = Math.exp(-Math.pow((h - 8.5) / 2.2, 2)) * 0.55;
  const midday = Math.exp(-Math.pow((h - 13) / 3.5, 2)) * 0.42;
  const evening = Math.exp(-Math.pow((h - 19) / 2.0, 2)) * 1.0;
  const night = 0.18 + 0.04 * Math.cos(((h - 3) / 24) * Math.PI * 2);
  return Math.max(night, morning + midday + evening);
}

export interface BuildSeriesArgs {
  regionId?: string;
  historyHours?: number;
  futureHours?: number;
  now?: Date;
  seedOffset?: number;
}

export function buildSeries(args: BuildSeriesArgs = {}): Series {
  const {
    regionId = "sys",
    historyHours = 168,
    futureHours = 48,
    now = new Date(),
    seedOffset = 0,
  } = args;

  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const rng = mulberry32(0xc4577 ^ region.peak ^ seedOffset);

  const history: HistoryPoint[] = [];
  const totalH = historyHours;
  const startMs = now.getTime() - (totalH - 1) * 3600_000;

  let drift = 0;
  for (let i = 0; i < totalH; i++) {
    const t = new Date(startMs + i * 3600_000);
    const hf = t.getHours() + t.getMinutes() / 60;
    const dow = t.getDay();
    const weekendFactor = dow === 0 || dow === 6 ? 0.86 : 1.0;
    const shape = curveShape(hf);
    const seasonal = 1 + 0.05 * Math.sin((i / 24) * Math.PI * 2 + 0.3);
    const baseDemand =
      region.base + (region.peak - region.base) * shape * weekendFactor * seasonal;

    drift = drift * 0.85 + (rng() - 0.5) * 60;
    const noise = (rng() - 0.5) * 80;
    const actual = baseDemand + drift + noise;
    const errPct = (rng() - 0.5) * 0.045 + 0.005 * Math.sin(i / 11);
    const predicted = actual * (1 - errPct);

    if (i >= totalH - 38 && i <= totalH - 33) {
      const k = 1 - Math.abs(i - (totalH - 35.5)) / 4;
      const bump = 480 * Math.max(0, k);
      history.push({
        t,
        actual: actual + bump,
        predicted,
        anomaly: i === totalH - 36 ? "heatwave" : null,
      });
      continue;
    }
    if (i >= totalH - 9 && i <= totalH - 6) {
      const k = 1 - Math.abs(i - (totalH - 7.5)) / 2;
      const dip = 220 * Math.max(0, k);
      history.push({
        t,
        actual: actual - dip,
        predicted,
        anomaly: i === totalH - 8 ? "solar-drop" : null,
      });
      continue;
    }
    history.push({ t, actual, predicted, anomaly: null });
  }

  const future: ForecastPoint[] = [];
  for (let i = 1; i <= futureHours; i++) {
    const t = new Date(now.getTime() + i * 3600_000);
    const hf = t.getHours() + t.getMinutes() / 60;
    const dow = t.getDay();
    const weekendFactor = dow === 0 || dow === 6 ? 0.86 : 1.0;
    const shape = curveShape(hf);
    const seasonal = 1 + 0.05 * Math.sin(((totalH + i) / 24) * Math.PI * 2 + 0.3);
    const predicted =
      region.base + (region.peak - region.base) * shape * weekendFactor * seasonal;
    const widen = 30 + i * 6;
    future.push({ t, predicted, p10: predicted - widen, p90: predicted + widen });
  }

  const next24 = future.slice(0, 24);
  const peak = next24.reduce((m, p) => (p.predicted > m.predicted ? p : m), next24[0]);
  const trough = next24.reduce((m, p) => (p.predicted < m.predicted ? p : m), next24[0]);

  return { region, history, future, peak, trough };
}

export function computeMetrics(history: HistoryPoint[]): Metrics {
  if (history.length === 0) {
    return { mae: 0, rmse: 0, mape: 0, bias: 0, hit: 0 };
  }
  const errs = history.map((h) => h.actual - h.predicted);
  const absErrs = errs.map((e) => Math.abs(e));
  const pctErrs = history.map((h) => Math.abs(h.actual - h.predicted) / h.actual);
  const mae = absErrs.reduce((a, b) => a + b, 0) / absErrs.length;
  const rmse = Math.sqrt(errs.reduce((a, b) => a + b * b, 0) / errs.length);
  const mape = (pctErrs.reduce((a, b) => a + b, 0) / pctErrs.length) * 100;
  const bias = errs.reduce((a, b) => a + b, 0) / errs.length;
  const hit = (pctErrs.filter((p) => p <= 0.03).length / pctErrs.length) * 100;
  return { mae, rmse, mape, bias, hit };
}

export const ANOMALY_DETAILS: Record<AnomalyKey, AnomalyDetail> = {
  heatwave: {
    title: "Permintaan melampaui peramalan",
    sev: "critical",
    desc: "Gelombang panas berkepanjangan mendorong beban pendingin 6,4% di atas peramalan selama 5 jam.",
    factors: [
      { k: "Temp dev (+4.1°C)", v: "+312 MW", w: 0.62, sign: 1 },
      { k: "Humidity (+18%)", v: "+108 MW", w: 0.22, sign: 1 },
      { k: "Cloud cover (−40%)", v: "+74 MW", w: 0.16, sign: 1 },
      { k: "Wind speed", v: "−14 MW", w: 0.04, sign: -1 },
    ],
  },
  "solar-drop": {
    title: "Kekurangan tenaga surya di balik meter",
    sev: "warning",
    desc: "Lapisan awan di atas sabuk pesisir memangkas pembangkitan PV; permintaan bersih melonjak mendahului pengiriman.",
    factors: [
      { k: "Solar irradiance", v: "+186 MW", w: 0.71, sign: 1 },
      { k: "Cloud cover", v: "+44 MW", w: 0.18, sign: 1 },
      { k: "Temp dev", v: "+12 MW", w: 0.05, sign: 1 },
      { k: "Hour-of-day", v: "−6 MW", w: 0.03, sign: -1 },
    ],
  },
};

export function pointExplainer(point: ExplainerPoint): ExplainerData {
  const actual = point.actual;
  const err = (actual ?? point.predicted) - point.predicted;
  const errPct = (err / point.predicted) * 100;
  return {
    title: actual != null ? "Rincian faktor peramalan" : "Pendorong peramalan",
    sev: "info",
    desc:
      actual != null
        ? `Permintaan realisasi ${err >= 0 ? "di atas" : "di bawah"} peramalan sebesar ${Math.abs(errPct).toFixed(2)}%.`
        : "Atribusi model untuk permintaan terprediksi pada jam ini.",
    factors: [
      { k: "Hour-of-day baseline", v: `${(point.predicted * 0.62).toFixed(0)} MW`, w: 0.62, sign: 1 },
      { k: "Day-of-week", v: `${(point.predicted * 0.18).toFixed(0)} MW`, w: 0.18, sign: 1 },
      { k: "Temperature", v: `${(point.predicted * 0.12).toFixed(0)} MW`, w: 0.12, sign: 1 },
      { k: "Holiday flag", v: "0 MW", w: 0, sign: 0 },
      { k: "Special events", v: `${(point.predicted * 0.04).toFixed(0)} MW`, w: 0.04, sign: 1 },
      {
        k: "Residual",
        v: `${err.toFixed(0)} MW`,
        w: Math.min(0.2, Math.abs(err) / point.predicted),
        sign: err >= 0 ? 1 : -1,
      },
    ],
  };
}
