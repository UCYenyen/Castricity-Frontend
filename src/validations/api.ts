import { z } from "zod";
import { severitySchema } from "./dashboard";

const explainerFactorSchema = z.object({
  k: z.string(),
  v: z.string(),
  w: z.number(),
  sign: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export const apiHistoricalPointSchema = z.object({
  date: z.string(),
  actual: z.number(),
  predicted: z.number(),
  prophet_baseline: z.number().optional(),
  residual: z.number().optional(),
});

export const apiHistoricalSchema = z.array(apiHistoricalPointSchema);

export const apiFuturePointSchema = z.object({
  date: z.string(),
  predicted: z.number(),
  lower_bound: z.number(),
  upper_bound: z.number(),
});

export const apiFutureSchema = z.array(apiFuturePointSchema);

export const apiMetricsSchema = z.object({
  mae: z.number(),
  rmse: z.number(),
  mape: z.number(),
  r2: z.number(),
  n_samples: z.number(),
});

export const apiAnomalySchema = z.object({
  date: z.string(),
  value: z.number(),
  severity: severitySchema,
  score: z.number().optional(),
  deviation_pct: z.number().optional(),
});

export const apiAnomaliesSchema = z.array(apiAnomalySchema);

export const whatIfPayloadSchema = z.object({
  target_date: z.string(),
  avg_temp: z.number(),
  rainfall: z.number(),
  is_holiday: z.boolean(),
});

const shapContributionSchema = z.object({
  feature: z.string(),
  value: z.number(),
  contribution: z.number(),
});

export const apiWhatIfResultSchema = z.object({
  target_date: z.string(),
  predicted_mwh: z.number(),
  prophet_baseline: z.number(),
  lgbm_residual: z.number(),
  base_value: z.number(),
  shap_contributions: z.array(shapContributionSchema),
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
