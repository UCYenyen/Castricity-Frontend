"use client";
import { Info, X } from "lucide-react";
import { fmtTime } from "@/lib/dashboard/format";
import { ANOMALY_DETAILS, pointExplainer } from "@/lib/dashboard/data";
import type { ExplainerPoint } from "@/types/dashboard";
import { Button } from "@/components/ui/button";

interface Props {
  point: ExplainerPoint;
  onClose: () => void;
}

export function Explainer({ point, onClose }: Props) {
  const exp = point.data
    ?? (point.anomalyKey ? ANOMALY_DETAILS[point.anomalyKey] : pointExplainer(point));

  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-accent-cyan/25 bg-linear-to-b from-accent-cyan/5 to-popover/40 px-4 py-3.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-accent-cyan/30 bg-accent-cyan/15 text-accent-cyan-2">
        <Info size={16} strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-3.5">
          <div>
            <div className="text-[13px] font-semibold">{exp.title}</div>
            <div className="mt-0.5 text-xs text-text-secondary">{exp.desc}</div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="mono text-[11px] text-muted-foreground">
              {fmtTime(point.t, { withDate: true })}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close"
              className="size-7 text-muted-foreground"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
        <div className="mt-1.5 flex flex-col gap-1">
          {exp.factors.map((f, i) => (
            <div
              key={i}
              className="grid items-center gap-2.5 text-[11.5px]"
              style={{ gridTemplateColumns: "120px 1fr 56px" }}
            >
              <div className="text-text-secondary">{f.k}</div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-muted-foreground/10">
                <i
                  className="absolute inset-y-0"
                  style={{
                    width: `${f.w * 50}%`,
                    left: f.sign < 0 ? `${50 - f.w * 50}%` : "50%",
                    background: f.sign < 0 ? "var(--accent-red)" : "var(--accent-cyan)",
                  }}
                />
              </div>
              <div className="mono text-right">{f.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
