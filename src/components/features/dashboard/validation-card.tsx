"use client";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import type { BrushRange, HistoryPoint, Metrics } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardAction, CardTitle, CardDescription } from "@/components/ui/card";
import { LegendItem, Swatch, SwatchDashed } from "./legend";
import { MetricsRow } from "./metrics-row";
import { ValidationChart } from "./validation-chart";
import { Brush } from "./brush";
import { DateRangePicker } from "./date-range-picker";

interface Props {
  history: HistoryPoint[];
  metrics: Metrics;
  range: DateRange | undefined;
  onRangeChange: (r: DateRange | undefined) => void;
  rangeBounds?: { min: Date; max: Date };
  accent: string;
  brush: BrushRange;
  onBrush: (b: BrushRange) => void;
  errorAsPct: boolean;
  onErrorAsPct: (v: boolean) => void;
  onPointClick: (p: HistoryPoint) => void;
  slicedCount: number;
}

export function ValidationCard({
  history, metrics, range, onRangeChange, rangeBounds, accent, brush, onBrush,
  errorAsPct, onErrorAsPct, onPointClick, slicedCount,
}: Props) {
  const [showActual, setShowActual] = useState(true);
  const [showPredicted, setShowPredicted] = useState(true);
  const [showError, setShowError] = useState(true);

  const headerSub = useMemo(
    () => `Predicted vs actual · ${slicedCount} day${slicedCount === 1 ? "" : "s"}`,
    [slicedCount]
  );

  return (
    <Card className="min-h-130">
      <CardHeader>
        <CardTitle>Historical validation</CardTitle>
        <CardDescription className="text-text-muted">{headerSub}</CardDescription>
        <CardAction>
          <DateRangePicker
            value={range}
            onChange={onRangeChange}
            minDate={rangeBounds?.min}
            maxDate={rangeBounds?.max}
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
