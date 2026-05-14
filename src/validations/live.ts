import { z } from "zod";
import { severitySchema } from "./dashboard";

const explainerFactorSchema = z.object({
  k: z.string(),
  v: z.string(),
  w: z.number(),
  sign: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export const apiLiveTickSchema = z.object({
  t: z.string(),
  actual: z.number(),
  predicted: z.number(),
  delta: z.number(),
  delta_pct: z.number(),
});

export const apiLiveMetricsSchema = z.object({
  mae: z.number(),
  rmse: z.number(),
  mape: z.number(),
  bias: z.number(),
  hit: z.number(),
  trend: z.enum(["improving", "stable", "degrading"]),
});

export const apiLiveAnomalySchema = z.object({
  id: z.string(),
  t: z.string(),
  severity: severitySchema,
  title: z.string(),
  asset: z.string(),
  description: z.string().default(""),
  delta: z.number(),
  factors: z.array(explainerFactorSchema).default([]),
});

export const liveSSEEventSchema = z.object({
  type: z.enum(["tick", "metrics", "anomaly", "heartbeat"]),
  data: z.unknown().nullable(),
});

export const liveWindowSchema = z.union([
  z.literal(1),
  z.literal(6),
  z.literal(12),
  z.literal(24),
]);

export type LiveWindowInput = z.infer<typeof liveWindowSchema>;
