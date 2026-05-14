"use client";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { fmtTime } from "@/lib/dashboard/format";
import { Button } from "@/components/ui/button";

interface LiveTopbarProps {
  now: Date;
  connected: boolean;
  lastUpdate: Date | null;
  onReconnect: () => void;
}

export function LiveTopbar({ now, connected, lastUpdate, onReconnect }: LiveTopbarProps) {
  return (
    <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-popover/60 px-4 py-2 backdrop-blur sm:px-7">
      <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
        <span>Operations</span>
        <span className="text-text-faint">›</span>
        <strong className="font-semibold text-foreground">Live forecast</strong>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-2.5 py-1.5">
          {connected ? (
            <Wifi size={13} className="text-accent-green" />
          ) : (
            <WifiOff size={13} className="text-accent-red" />
          )}
          <span className="mono text-xs text-text-secondary">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="mono rounded-lg border border-border bg-card/40 px-2.5 py-1.5 text-xs text-text-secondary">
          {fmtTime(now, { withDate: true })}
          <span className="ml-1.5 text-text-faint">UTC+00</span>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onReconnect}
          aria-label="Reconnect"
        >
          <RefreshCw size={14} />
        </Button>
      </div>
    </div>
  );
}
