import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { fmtMW, fmtSigned, fmtTime } from "@/lib/dashboard/format";
import type { AnomalyEntry, Severity } from "@/types/dashboard";

const SEV_CLASS: Record<Severity, string> = {
  critical: "border-accent-red/40 bg-accent-red/15 text-red-300",
  warning: "border-accent-orange/40 bg-accent-orange/15 text-amber-300",
  info: "border-accent-cyan/40 bg-accent-cyan/15 text-cyan-300",
};

interface AnomalyDialogProps {
  selected: AnomalyEntry | null;
  onClose: () => void;
}

export function AnomalyDialog({ selected, onClose }: AnomalyDialogProps) {
  return (
    <Dialog open={!!selected} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {selected && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`h-5 px-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${SEV_CLASS[selected.sev]}`}
                >
                  {selected.sev}
                </Badge>
                <DialogTitle className="text-sm">{selected.title}</DialogTitle>
              </div>
              <DialogDescription className="mono text-[11px] text-text-muted">
                {fmtTime(selected.point.t, { withDate: true, withYear: true })} · {selected.asset}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <DetailTile label="Actual" value={selected.point.actual != null ? `${fmtMW(selected.point.actual)} MW` : "—"} />
              <DetailTile label="Predicted" value={`${fmtMW(selected.point.predicted)} MW`} />
              <DetailTile
                label="Delta"
                value={`${fmtSigned((selected.point.actual ?? 0) - selected.point.predicted, 0)} MW`}
                accent={
                  (selected.point.actual ?? 0) - selected.point.predicted >= 0
                    ? "text-accent-red"
                    : "text-accent-green"
                }
              />
            </div>

            {selected.point.data?.desc && (
              <p className="mt-3 text-xs text-text-secondary">
                {selected.point.data.desc}
              </p>
            )}

            {selected.point.data?.factors && selected.point.data.factors.length > 0 && (
              <div className="mt-4 flex flex-col gap-1.5">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Faktor kontribusi
                </div>
                {selected.point.data.factors.map((f, i) => (
                  <div
                    key={i}
                    className="grid items-center gap-2.5 text-[11.5px]"
                    style={{ gridTemplateColumns: "120px 1fr 64px" }}
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
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailTile({ label, value, accent = "text-foreground" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-popover/55 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mono mt-1 text-sm font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
