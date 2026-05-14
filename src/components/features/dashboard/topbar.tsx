"use client";
import { RefreshCw } from "lucide-react";
import { fmtTime } from "@/lib/dashboard/format";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  now: Date;
  onRefresh: () => void;
  refreshing: boolean;
}

export function DashboardTopbar({ now, onRefresh, refreshing }: TopbarProps) {
  return (
    <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-popover/60 px-4 py-2 backdrop-blur sm:px-7">
      <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
        <span>Operations</span>
        <span className="text-text-faint">›</span>
        <strong className="font-semibold text-foreground">Dashboard</strong>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="mono rounded-lg border border-border bg-card/40 px-2.5 py-1.5 text-xs text-text-secondary">
          {fmtTime(now, { withDate: true })}
          <span className="ml-1.5 text-text-faint">UTC+00</span>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onRefresh}
          aria-label="Refresh"
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} />
        </Button>
      </div>
    </div>
  );
}
