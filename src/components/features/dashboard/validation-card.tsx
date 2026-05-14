"use client";
import { useMemo, useState } from "react";
import type { BrushRange, HistoryPoint, HistoryWindow, Metrics } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardAction, CardTitle, CardDescription } from "@/components/ui/card";
import { Segmented } from "./segmented";
import { LegendItem, Swatch, SwatchDashed } from "./legend";
import { MetricsRow } from "./metrics-row";
import { ValidationChart } from "./validation-chart";
import { Brush } from "./brush";

interface Props {
  history: HistoryPoint[];
  metrics: Metrics;
  historyHours: HistoryWindow;
  onHistoryHours: (h: HistoryWindow) => void;
  accent: string;
  brush: BrushRange;
  onBrush: (b: BrushRange) => void;
  errorAsPct: boolean;
  onErrorAsPct: (v: boolean) => void;
  onPointClick: (p: HistoryPoint) => void;
  slicedCount: number;
}

const WINDOW_OPTS = [
  { v: 24 as const, l: "24h" },
  { v: 72 as const, l: "3d" },
  { v: 168 as const, l: "7d" },
  { v: 720 as const, l: "30d" },
];

export function ValidationCard({
  history, metrics, historyHours, onHistoryHours, accent, brush, onBrush,
  errorAsPct, onErrorAsPct, onPointClick, slicedCount,
}: Props) {
  const [showActual, setShowActual] = useState(true);
  const [showPredicted, setShowPredicted] = useState(true);
  const [showError, setShowError] = useState(true);

  const headerSub = useMemo(
    () => `Predicted vs actual · ${slicedCount}h window`,
    [slicedCount]
  );

  return (
    <Card className="min-h-130">
      <CardHeader>
        <CardTitle>Historical validation</CardTitle>
        <CardDescription className="text-text-muted">{headerSub}</CardDescription>
        <CardAction>
          <Segmented
            options={WINDOW_OPTS}
            value={historyHours}
            onChange={onHistoryHours}
            ariaLabel="Validation window"
          />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <MetricsRow metrics={metrics} />

        <div className="mb-2 flex flex-wrap items-center gap-3.5">
          <LegendItem
            checked={showActual}
            onChange={setShowActual}
            swatch={<Swatch color={accent} />}
            label="Actual"
          />
          <LegendItem
            checked={showPredicted}
            onChange={setShowPredicted}
            swatch={<SwatchDashed />}
            label="Predicted"
          />
          <LegendItem
            checked={showError}
            onChange={setShowError}
            swatch={<Swatch color="rgba(239,68,68,0.7)" />}
            label="Error band"
          />
          <div className="ml-auto">
            <LegendItem
              checked={errorAsPct}
              onChange={onErrorAsPct}
              swatch={null}
              label="Error as %"
            />
          </div>
        </div>

        <div className="relative min-h-90 flex-1">
          <ValidationChart
            data={history}
            accent={accent}
            showActual={showActual}
            showPredicted={showPredicted}
            showError={showError}
            errorAsPct={errorAsPct}
            brush={brush}
            onPointClick={onPointClick}
          />
        </div>

        <Brush data={history} value={brush} onChange={onBrush} />
      </CardContent>
    </Card>
  );
}
