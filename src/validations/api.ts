import { z } from "zod";
import { severitySchema } from "./dashboard";

const explainerFactorSchema = z.object({
  k: z.string(),
  v: z.string(),
  w: z.number(),
  sign: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export const apiHistoricalPointSchema = z.object({
  t: z.string(),
  actual: z.number(),
  predicted: z.number(),
  anomaly: z.string().nullish(),
});

export const apiHistoricalSchema = z.array(apiHistoricalPointSchema);

export const apiFuturePointSchema = z.object({
  t: z.string(),
  predicted: z.number(),
  p10: z.number(),
  p90: z.number(),
});

export const apiFutureSchema = z.array(apiFuturePointSchema);

export const apiMetricsSchema = z.object({
  mae: z.number(),
  rmse: z.number(),
  mape: z.number(),
  bias: z.number(),
  hit: z.number(),
});

export const apiAnomalySchema = z.object({
  id: z.string().optional(),
  t: z.string(),
  severity: severitySchema,
  title: z.string(),
  asset: z.string(),
  description: z.string().optional(),
  predicted: z.number().optional(),
  actual: z.number().optional(),
  factors: z.array(explainerFactorSchema).default([]),
});

export const apiAnomaliesSchema = z.array(apiAnomalySchema);

export const whatIfPayloadSchema = z.object({
  target_date: z.string(),
  avg_temp: z.number(),
  rainfall: z.number(),
  is_holiday: z.boolean(),
});

export const apiWhatIfResultSchema = z.object({
  predicted: z.number(),
  baseline: z.number(),
  delta: z.number(),
  factors: z.array(explainerFactorSchema).optional(),
});

export type WhatIfPayloadInput = z.infer<typeof whatIfPayloadSchema>;

export const apiFeatureInfoSchema = z.object({
  name: z.string(),
  category: z.string(),
  description: z.string(),
  user_input: z.boolean(),
});

export const apiFeaturesResponseSchema = z.object({
  features: z.array(apiFeatureInfoSchema),
  total: z.number(),
});

export const apiRequiredFeaturesSchema = z.array(apiFeatureInfoSchema);

export const apiFeatureImportanceSchema = z.object({
  feature: z.string(),
  importance: z.number(),
});

export const apiFeatureImportanceListSchema = z.array(apiFeatureImportanceSchema);
