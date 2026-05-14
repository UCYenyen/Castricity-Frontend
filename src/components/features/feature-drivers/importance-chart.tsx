"use client";
import { useElementSize } from "@/hooks/use-element-size";
import type { ApiFeatureImportance } from "@/types/api";

interface Props {
  data: ApiFeatureImportance[];
  maxItems?: number;
}

const BAR_HEIGHT = 28;
const GAP = 6;
const LABEL_W = 140;
const VALUE_W = 70;
const PAD = { top: 8, right: 12, bottom: 8, left: 0 };

export function ImportanceChart({ data, maxItems = 18 }: Props) {
  const { ref, size } = useElementSize<HTMLDivElement>({ w: 600, h: 400 });
  const sorted = [...data]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, maxItems);
  const maxVal = Math.max(1e-6, ...sorted.map((d) => d.importance));

  const plotW = Math.max(100, size.w - LABEL_W - VALUE_W - PAD.left - PAD.right);
  const totalH = PAD.top + sorted.length * (BAR_HEIGHT + GAP) - GAP + PAD.bottom;

  return (
    <div ref={ref} className="w-full overflow-x-auto">
      <svg
        width={size.w}
        height={Math.max(totalH, 200)}
        className="select-none"
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        {sorted.map((d, i) => {
          const y = PAD.top + i * (BAR_HEIGHT + GAP);
          const barW = (d.importance / maxVal) * plotW;
          const pct = ((d.importance / maxVal) * 100).toFixed(0);

          return (
            <g key={d.feature}>
              {/* label */}
              <text
                x={LABEL_W - 8}
                y={y + BAR_HEIGHT / 2}
                textAnchor="end"
                dominantBaseline="central"
                className="fill-muted-foreground"
                style={{ fontSize: 11 }}
              >
                {d.feature}
              </text>

              {/* bar background track */}
              <rect
                x={LABEL_W}
                y={y + 2}
                width={plotW}
                height={BAR_HEIGHT - 4}
                rx={4}
                className="fill-muted-foreground/5"
              />

              {/* bar fill */}
              <rect
                x={LABEL_W}
                y={y + 2}
                width={Math.max(2, barW)}
                height={BAR_HEIGHT - 4}
                rx={4}
                fill={barColor(i, sorted.length)}
                style={{
                  transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
                }}
              />

              {/* value */}
              <text
                x={LABEL_W + plotW + 8}
                y={y + BAR_HEIGHT / 2}
                textAnchor="start"
                dominantBaseline="central"
                className="fill-text-secondary"
                style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
              >
                {d.importance.toFixed(2)} ({pct}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function barColor(index: number, total: number): string {
  const t = total <= 1 ? 0 : index / (total - 1);
  if (t < 0.2) return "var(--accent-cyan)";
  if (t < 0.5) return "var(--accent-green)";
  if (t < 0.75) return "var(--accent-orange)";
  return "var(--accent-purple)";
}
