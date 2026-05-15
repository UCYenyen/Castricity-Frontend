"use client";
import { useMemo, useState, useEffect } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useLiveClock } from "@/hooks/use-live-clock";
import { DashboardTopbar } from "../dashboard/topbar";
import { AnomalyChart } from "./anomaly-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { fmtMW, fmtSigned, fmtTime } from "@/lib/dashboard/format";
import type { AnomalyEntry, Severity } from "@/types/dashboard";
import { AnomalyDialog } from "./anomaly-dialog";

const SEV_CLASS: Record<Severity, string> = {
  critical: "border-accent-red/40 bg-accent-red/15 text-red-300",
  warning: "border-accent-orange/40 bg-accent-orange/15 text-amber-300",
  info: "border-accent-cyan/40 bg-accent-cyan/15 text-cyan-300",
};

type SevFilter = "all" | Severity;

const HISTORY_OPTIONS = [
  { v: 24, label: "24 jam terakhir" },
  { v: 72, label: "3 hari terakhir" },
  { v: 168, label: "7 hari terakhir" },
  { v: 720, label: "30 hari terakhir" },
  { v: "all", label: "Semua waktu" },
] as const;

const ITEMS_PER_PAGE = 10;

export function AnomalyCenterView() {
  const now = useLiveClock(30_000);
  const [historyHours, setHistoryHours] = useState<number | null>(null);
  const [sev, setSev] = useState<SevFilter>("all");
  const [selected, setSelected] = useState<AnomalyEntry | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [sev, historyHours]);

  const { data, loading, refreshing, error, refresh } = useDashboardData({
    historyHours: historyHours === null ? undefined : historyHours,
    futureDays: 1,
    autoTickMs: 0,
  });

  const timeFilteredAnomalies = useMemo(() => {
    if (!data?.anomalies) return [];
    if (historyHours === null) return data.anomalies;
    
    // The filter strictly applies to the actual live time (Date.now())
    const cutoffMs = Date.now() - (historyHours * 3600_000);
    return data.anomalies.filter((a) => a.point.t.getTime() >= cutoffMs);
  }, [data?.anomalies, historyHours]);

  const filtered = useMemo(
    () => timeFilteredAnomalies.filter((a) => (sev === "all" ? true : a.sev === sev)),
    [timeFilteredAnomalies, sev]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(
    () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filtered, page]
  );

  const counts = useMemo(() => {
    const out = { critical: 0, warning: 0, info: 0 };
    for (const a of timeFilteredAnomalies) out[a.sev]++;
    return out;
  }, [timeFilteredAnomalies]);

  return (
    <div className="flex flex-col min-w-0">
      <DashboardTopbar
        title="Anomali Center"
        now={now}
        onRefresh={refresh}
        refreshing={refreshing}
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Anomali Center</h1>
          <p className="text-sm text-text-muted">
            Setiap titik permintaan anomali yang ditandai oleh model, ditampilkan dalam konteks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={historyHours === null ? "all" : String(historyHours)} onValueChange={(v) => setHistoryHours(v === "all" ? null : Number(v))}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HISTORY_OPTIONS.map((o) => (
                <SelectItem key={o.v} value={String(o.v)} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sev} onValueChange={(v) => setSev(v as SevFilter)}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Semua tingkat</SelectItem>
              <SelectItem value="critical" className="text-xs">Critical</SelectItem>
              <SelectItem value="warning" className="text-xs">Warning</SelectItem>
              <SelectItem value="info" className="text-xs">Info</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCcw size={14} />
            )}
            <span className="ml-1.5 text-xs">Perbarui</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Total" value={timeFilteredAnomalies.length} accent="text-foreground" />
        <SummaryTile label="Critical" value={counts.critical} accent="text-accent-red" />
        <SummaryTile label="Warning" value={counts.warning} accent="text-accent-orange" />
        <SummaryTile label="Info" value={counts.info} accent="text-accent-cyan" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertTitle>Gagal memuat anomali</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* <Card>
        <CardHeader>
          <CardTitle className="text-sm">Demand series with flagged points</CardTitle>
          <CardDescription className="text-text-muted text-xs">
            Click a marker to inspect details. Markers are colored by severity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-[340px] w-full">
            {loading && !data ? (
              <div className="flex h-full items-center justify-center text-text-muted text-xs">
                <Loader2 size={14} className="mr-2 animate-spin" />
                Loading series…
              </div>
            ) : (
              <AnomalyChart
                history={data?.history ?? []}
                anomalies={filtered}
                selectedAnomalyT={selected?.point.t.getTime() ?? null}
                onSelect={setSelected}
              />
            )}
          </div>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Semua anomali</CardTitle>
          <CardDescription className="text-text-muted text-xs">
            {filtered.length} {sev === "all" ? "total" : sev} · dalam jendela waktu
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead className="w-[110px]">Tingkat</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead className="hidden md:table-cell">Aset</TableHead>
                <TableHead className="hidden md:table-cell">Waktu</TableHead>
                <TableHead className="text-right">Δ (MW)</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Aktual</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Prediksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-xs text-text-muted py-8">
                    Tidak ada anomali dalam jendela waktu ini.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((a, i) => {
                  const delta = (a.point.actual ?? 0) - a.point.predicted;
                  const rowNumber = (page - 1) * ITEMS_PER_PAGE + i + 1;
                  return (
                    <TableRow
                      key={i}
                      onClick={() => setSelected(a)}
                      className="cursor-pointer"
                    >
                      <TableCell className="text-xs text-text-muted mono">{rowNumber}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`h-5 px-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${SEV_CLASS[a.sev]}`}
                        >
                          {a.sev}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell className="hidden md:table-cell text-text-secondary">{a.asset}</TableCell>
                      <TableCell className="hidden md:table-cell mono text-text-muted">
                        {fmtTime(a.point.t, { withDate: true, withYear: true })}
                      </TableCell>
                      <TableCell
                        className={`text-right mono ${delta >= 0 ? "text-accent-red" : "text-accent-green"}`}
                      >
                        {fmtSigned(delta, 0)}
                      </TableCell>
                      <TableCell className="text-right mono hidden lg:table-cell">
                        {a.point.actual != null ? fmtMW(a.point.actual) : "—"}
                      </TableCell>
                      <TableCell className="text-right mono hidden lg:table-cell">
                        {fmtMW(a.point.predicted)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          
          {filtered.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <div className="text-xs text-text-muted">
                Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1} sampai {Math.min(page * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} entri
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 text-xs"
                >
                  <ChevronLeft size={14} className="mr-1" /> Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                  className="h-8 text-xs"
                >
                  Berikutnya <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AnomalyDialog selected={selected} onClose={() => setSelected(null)} />
    </div>
  </div>
  );
}

function SummaryTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-lg border border-border bg-popover/55 px-3.5 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mono mt-1 text-xl font-semibold ${accent}`}>{value}</div>
    </div>
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
