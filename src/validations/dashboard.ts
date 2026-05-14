import { z } from "zod";

export const accentSchema = z.enum(["cyan", "green", "amber", "violet"]);
export const densitySchema = z.enum(["compact", "comfy"]);
export const severitySchema = z.enum(["critical", "warning", "info"]);

export const tweaksSchema = z.object({
  accent: accentSchema,
  density: densitySchema,
  showBand: z.boolean(),
  showHistoryOnForecast: z.boolean(),
  errorAsPct: z.boolean(),
});

export const historyWindowSchema = z.union([
  z.literal(24),
  z.literal(72),
  z.literal(168),
  z.literal(720),
]);

export const forecastHorizonSchema = z.union([
  z.literal(24),
  z.literal(48),
  z.literal(72),
  z.literal(168),
]);

export const regionIdSchema = z.enum(["sys", "north", "metro", "coast", "inland"]);

export const buildSeriesArgsSchema = z.object({
  regionId: regionIdSchema.default("sys"),
  historyHours: z.number().int().positive().max(2000).default(168),
  futureHours: z.number().int().positive().max(336).default(48),
  now: z.date().default(() => new Date()),
  seedOffset: z.number().int().nonnegative().default(0),
});

export type BuildSeriesArgs = z.infer<typeof buildSeriesArgsSchema>;
export type TweaksInput = z.infer<typeof tweaksSchema>;
