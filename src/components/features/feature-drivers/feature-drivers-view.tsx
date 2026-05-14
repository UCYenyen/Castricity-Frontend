"use client";
import { useMemo, useState } from "react";
import { useFeatureDrivers } from "@/hooks/use-feature-drivers";
import { useLiveClock } from "@/hooks/use-live-clock";
import { DashboardTopbar } from "../dashboard/topbar";
import type { ApiFeatureInfo, ApiFeatureImportance } from "@/types/api";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, Loader2, RefreshCcw, Search, Workflow,
} from "lucide-react";
import { ImportanceChart } from "./importance-chart";

const CATEGORY_LABELS: Record<string, string> = {
  temporal: "Temporal",
  lag: "Lag",
  rolling: "Rolling",
  exogenous: "Eksogen",
  categorical: "Kategorikal",
};

const CATEGORY_BADGE: Record<string, string> = {
  temporal: "border-accent-orange/30 bg-accent-orange/15 text-accent-orange",
  lag: "border-accent-orange/30 bg-accent-orange/15 text-accent-orange",
  rolling: "border-accent-orange/30 bg-accent-orange/15 text-accent-orange",
  exogenous: "border-accent-orange/30 bg-accent-orange/15 text-accent-orange",
  categorical: "border-accent-orange/30 bg-accent-orange/15 text-accent-orange",
};

type CategoryFilter = "all" | string;

export function FeatureDriversView() {
  const now = useLiveClock(30_000);
  const { data, loading, refreshing, error, refresh } = useFeatureDrivers();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    if (!data) return [];
    const cats = new Set(data.features.map((f) => f.category));
    return Array.from(cats).sort();
  }, [data]);

  const importanceMap = useMemo(() => {
    const m = new Map<string, number>();
    if (data) {
      for (const imp of data.importance) m.set(imp.feature, imp.importance);
    }
    return m;
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.features;
    if (category !== "all") {
      list = list.filter((f) => f.category === category);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) => (importanceMap.get(b.name) ?? 0) - (importanceMap.get(a.name) ?? 0)
    );
  }, [data, category, search, importanceMap]);

  const counts = useMemo(() => {
    if (!data) return { total: 0, userInput: 0, categories: 0 };
    return {
      total: data.features.length,
      userInput: data.features.filter((f) => f.user_input).length,
      categories: new Set(data.features.map((f) => f.category)).size,
    };
  }, [data]);

  return (
    <div className="flex flex-col min-w-0">
      <DashboardTopbar
        title="Feature Drivers"
        now={now}
        onRefresh={refresh}
        refreshing={refreshing}
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Workflow size={18} className="text-accent-purple" />
            Feature Drivers
          </h1>
          <p className="text-sm text-text-muted">
            Semua fitur yang digunakan model hybrid Prophet + LightGBM, beserta tingkat kepentingan SHAP global.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCcw size={14} />
          )}
          <span className="ml-1.5 text-xs">Perbarui</span>
        </Button>
      </header>

      {/* Summary tiles */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryTile label="Total fitur" value={counts.total} accent="text-foreground" />
          <SummaryTile label="Input pengguna" value={counts.userInput} accent="text-accent-orange" />
          <SummaryTile label="Kategori" value={counts.categories} accent="text-accent-purple" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertTitle>Gagal memuat fitur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading skeleton */}
      {loading && !data && <PageSkeleton />}

      {data && (
        <>
          {/* Importance chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Kepentingan fitur global (SHAP)</CardTitle>
              <CardDescription className="text-text-muted text-xs">
                Rata-rata |SHAP value| di seluruh set prediksi — menunjukkan seberapa besar pengaruh tiap fitur terhadap prediksi permintaan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.importance.length > 0 ? (
                <ImportanceChart data={data.importance} />
              ) : (
                <div className="flex h-40 items-center justify-center text-text-muted text-xs">
                  Data kepentingan tidak tersedia.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Katalog fitur</CardTitle>
              <CardDescription className="text-text-muted text-xs">
                {filtered.length} dari {data.features.length} fitur ditampilkan
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari fitur..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <Select value={category} onValueChange={(v: string) => setCategory(v)}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Semua kategori</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {CATEGORY_LABELS[c] ?? c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Nama fitur</TableHead>
                    <TableHead className="w-[120px]">Kategori</TableHead>
                    <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                    <TableHead className="text-right w-[100px]">SHAP</TableHead>
                    <TableHead className="text-center w-[90px]">Input</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-xs text-text-muted py-8">
                        Tidak ada fitur yang cocok.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((f, i) => {
                      const imp = importanceMap.get(f.name);
                      return (
                        <FeatureRow key={f.name} feature={f} importance={imp} index={i + 1} maxImportance={data.importance[0]?.importance ?? 1} />
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FeatureRow({
  feature,
  importance,
  index,
  maxImportance,
}: {
  feature: ApiFeatureInfo;
  importance?: number;
  index: number;
  maxImportance: number;
}) {
  const barPct = importance != null ? (importance / Math.max(1e-6, maxImportance)) * 100 : 0;

  return (
    <TableRow>
      <TableCell className="text-xs text-text-muted mono">{index}</TableCell>
      <TableCell className="font-medium text-[13px]">{feature.name}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`h-5 px-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${CATEGORY_BADGE[feature.category] ?? ""}`}
        >
          {CATEGORY_LABELS[feature.category] ?? feature.category}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell text-text-secondary text-xs">
        {feature.description}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="hidden sm:block relative h-1.5 w-16 overflow-hidden rounded-full bg-muted-foreground/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${barPct}%`,
                background: "var(--accent-cyan)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span className="mono text-xs text-text-secondary">
            {importance != null ? importance.toFixed(2) : "—"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {feature.user_input ? (
          <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-bold uppercase tracking-[0.12em] border-accent-green/30 bg-accent-green/15 text-accent-green">
            Ya
          </Badge>
        ) : (
          <span className="text-xs text-text-faint">—</span>
        )}
      </TableCell>
    </TableRow>
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

function PageSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </>
  );
}
