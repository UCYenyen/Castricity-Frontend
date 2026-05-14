"use client";
import { useCallback, useState } from "react";
import { tweaksSchema } from "@/validations/dashboard";
import type { Tweaks } from "@/types/dashboard";

const DEFAULT_TWEAKS: Tweaks = {
  accent: "cyan",
  density: "comfy",
  showBand: true,
  showHistoryOnForecast: true,
  errorAsPct: false,
};

export function useTweaks(initial: Partial<Tweaks> = {}) {
  const [tweaks, setTweaks] = useState<Tweaks>(() =>
    tweaksSchema.parse({ ...DEFAULT_TWEAKS, ...initial })
  );

  const setTweak = useCallback(
    <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
      setTweaks((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return [tweaks, setTweak] as const;
}
