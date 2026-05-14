"use client";
import { fmtMW, fmtTime } from "@/lib/dashboard/format";
import type { LiveAnomaly } from "@/types/live";
import type { Severity } from "@/types/dashboard";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SEV_CLASS: Record<Severity, string> = {
  critical: "border-accent-red/40 bg-accent-red/15 text-red-300",
  warning: "border-accent-orange/40 bg-accent-orange/15 text-amber-300",
  info: "border-accent-cyan/40 bg-accent-cyan/15 text-cyan-300",
};

const SEV_DOT: Record<Severity, string> = {
  critical: "bg-accent-red",
  warning: "bg-accent-orange",
  info: "bg-accent-cyan",
};

interface Props {
  anomalies: readonly LiveAnomaly[];
}

export function LiveAnomalyFeed({ anomalies }: Props) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="pulse-dot-red" style={{ width: 8, height: 8 }} />
          Anomaly feed
        </CardTitle>
        <CardDescription className="text-text-muted text-xs">
          {anomalies.length} alert{anomalies.length !== 1 ? "s" : ""} active
        </CardDescription>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-text-faint text-xs mono">
            No anomalies detected
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {anomalies.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2.5 rounded-lg border border-border bg-popover/50 px-3 py-2.5 transition-colors hover:bg-white/2"
              >
                <div className={`mt-1 size-2 shrink-0 rounded-full ${SEV_DOT[a.severity]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`h-4 px-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${SEV_CLASS[a.severity]}`}
                    >
                      {a.severity}
                    </Badge>
                    <span className="text-[12px] font-medium text-foreground truncate">
                      {a.title}
                    </span>
                  </div>
                  <div className="mono text-[10px] text-muted-foreground mt-0.5">
                    {a.asset} · Δ{a.delta > 0 ? "+" : ""}{fmtMW(a.delta)} MW · {fmtTime(a.t)}
                  </div>
                  {a.description && (
                    <div className="text-[11px] text-text-faint mt-1 line-clamp-2">
                      {a.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
