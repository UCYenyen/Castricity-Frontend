"use client";
import type { AnomalyEntry, Severity } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";

const SEV_CLASS: Record<Severity, string> = {
  critical: "border-accent-red/40 bg-accent-red/15 text-red-300",
  warning: "border-accent-orange/40 bg-accent-orange/15 text-amber-300",
  info: "border-accent-cyan/40 bg-accent-cyan/15 text-cyan-300",
};

interface Props {
  anomalies: AnomalyEntry[];
  onSelect: (a: AnomalyEntry) => void;
}

export function AnomalyStrip({ anomalies, onSelect }: Props) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-linear-to-r from-accent-red/5 via-accent-orange/4 to-card/60">
      <div className="flex min-w-57.5 items-center gap-2.5 border-r border-border px-4 py-3">
        <span className="pulse-dot-red" />
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Total Anomali
          </div>
          <div className="mono text-lg font-semibold text-foreground">
            {anomalies.length} aktif
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-stretch overflow-x-auto">
        {anomalies.map((a, i) => (
          <button
            key={i}
            type="button"
            className="flex min-w-60 flex-col justify-center gap-1 px-4 py-2.5 text-left transition-colors hover:bg-white/2"
            style={{
              borderRight: i < anomalies.length - 1 ? "1px solid var(--border)" : "none",
            }}
            onClick={() => onSelect(a)}
          >
            <div className="flex flex-col flex-reverse items-center gap-2">
              <Badge
                variant="outline"
                className={`h-4 px-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${SEV_CLASS[a.sev]}`}
              >
                {a.sev}
              </Badge>
              <span className="text-[13px] font-medium text-foreground">{a.title}</span>
            </div>
            {/* <div className="mono text-[11px] text-muted-foreground">
              {a.asset} · {a.timeAgo}
            </div> */}
          </button>
        ))}
      </div>
    </div>
  );
}
