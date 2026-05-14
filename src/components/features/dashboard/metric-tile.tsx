"use client";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "./sparkline";

export type TrendDir = "up" | "down" | "flat";
export type AccentTone = "cyan" | "green" | "amber" | "red" | "violet";

const ACCENT_VAR: Record<AccentTone, string> = {
  cyan: "var(--accent-cyan)",
  green: "var(--accent-green)",
  amber: "var(--accent-orange)",
  red: "var(--accent-red)",
  violet: "var(--accent-purple)",
};

export interface MetricBadge {
  tone: "green" | "orange" | "cyan" | "red";
  text: string;
}

interface MetricTileProps {
  label: string;
  value: ReactNode;
  unit?: string;
  trend?: { dir: TrendDir; text: string };
  badge?: MetricBadge;
  accent?: AccentTone;
  sparkline?: number[];
  hero?: boolean;
  corner?: string;
}

const BADGE_TONE: Record<MetricBadge["tone"], string> = {
  green: "border-accent-green/25 bg-accent-green/15 text-accent-green",
  orange: "border-accent-orange/25 bg-accent-orange/15 text-accent-orange",
  cyan: "border-accent-cyan/25 bg-accent-cyan/15 text-accent-cyan-2",
  red: "border-accent-red/25 bg-accent-red/15 text-accent-red",
};

const TREND_TONE: Record<TrendDir, string> = {
  up: "bg-accent-green/15 text-accent-green",
  down: "bg-accent-red/15 text-accent-red",
  flat: "bg-muted-foreground/15 text-muted-foreground",
};

export function MetricTile({
  label, value, unit, trend, badge, accent = "cyan", sparkline, hero, corner,
}: MetricTileProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-linear-to-b from-card/70 to-popover/70 px-5 py-4.5"
      style={{ minHeight: hero ? 168 : 148 }}
    >
      {corner && (
        <div className="mono absolute right-3.5 top-3.5 text-[10px] tracking-[0.12em] text-text-faint">
          {corner}
        </div>
      )}
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2 leading-none">
        <span
          className="mono font-bold"
          style={{
            fontSize: hero ? 64 : 44,
            letterSpacing: "-0.01em",
            ...(hero
              ? {
                  background: "linear-gradient(180deg,#fff,#a5f3fc)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 0 60px rgba(34,211,238,0.25)",
                }
              : {}),
          }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[13px] font-medium tracking-wider text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        {trend && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${TREND_TONE[trend.dir]}`}
          >
            {trend.dir === "up" ? "▲" : trend.dir === "down" ? "▼" : "◆"} {trend.text}
          </span>
        )}
        {badge && (
          <Badge
            variant="outline"
            className={`h-5 text-[10px] uppercase tracking-[0.12em] ${BADGE_TONE[badge.tone]}`}
          >
            {badge.text}
          </Badge>
        )}
      </div>
      {sparkline && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10.5 opacity-85">
          <Sparkline data={sparkline} color={ACCENT_VAR[accent]} height={42} />
        </div>
      )}
    </div>
  );
}
