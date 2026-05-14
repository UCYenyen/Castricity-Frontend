"use client";
import { useMemo, useRef } from "react";
import type { BrushRange, HistoryPoint } from "@/types/dashboard";

interface Props {
  data: HistoryPoint[];
  value: BrushRange;
  onChange: (r: BrushRange) => void;
}

type DragMode = "l" | "r" | "pan";

export function Brush({ data, value, onChange }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const onDown = (mode: DragMode) => (e: React.MouseEvent) => {
    e.preventDefault();
    const w = wrapRef.current?.clientWidth ?? 600;
    const startX = e.clientX;
    const start: [number, number] = [value[0], value[1]];
    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / w;
      let [a, b] = start;
      if (mode === "l") a = Math.max(0, Math.min(b - 0.05, a + dx));
      else if (mode === "r") b = Math.min(1, Math.max(a + 0.05, b + dx));
      else {
        const span = b - a;
        a = Math.max(0, Math.min(1 - span, a + dx));
        b = a + span;
      }
      onChange([a, b]);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const path = useMemo(() => {
    if (!data.length) return "";
    const min = Math.min(...data.map((d) => d.actual));
    const max = Math.max(...data.map((d) => d.actual));
    const w = 1000;
    const h = 32;
    return data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        const yv = h - 4 - ((d.actual - min) / Math.max(1, max - min)) * (h - 8);
        return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + yv.toFixed(1);
      })
      .join(" ");
  }, [data]);

  const onTrackDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = (e.clientX - r.left) / r.width;
    const span = value[1] - value[0];
    const a = Math.max(0, Math.min(1 - span, f - span / 2));
    onChange([a, a + span]);
  };

  return (
    <div className="flex items-center gap-2.5 mt-2">
      <div className="text-[10px] uppercase tracking-[0.14em] min-w-[60px]" style={{ color: "var(--text-faint)" }}>
        Window
      </div>
      <div
        ref={wrapRef}
        className="relative flex-1 h-[34px] rounded-md overflow-hidden cursor-crosshair select-none"
        style={{ background: "rgba(15,23,41,0.55)", border: "1px solid var(--card-border)" }}
        onMouseDown={onTrackDown}
      >
        <svg viewBox="0 0 1000 32" preserveAspectRatio="none" className="block w-full h-full">
          <path d={path} stroke="rgba(148,163,184,0.45)" strokeWidth="1.2" fill="none" />
        </svg>
        <div
          className="absolute top-0 bottom-0 cursor-grab active:cursor-grabbing"
          style={{
            left: `${value[0] * 100}%`,
            width: `${(value[1] - value[0]) * 100}%`,
            background: "rgba(6,182,212,0.13)",
            borderLeft: "2px solid var(--accent-cyan)",
            borderRight: "2px solid var(--accent-cyan)",
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onDown("pan")(e);
          }}
        >
          <div
            className="absolute top-0 bottom-0 cursor-ew-resize"
            style={{ left: -3, width: 6 }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onDown("l")(e);
            }}
          />
          <div
            className="absolute top-0 bottom-0 cursor-ew-resize"
            style={{ right: -3, width: 6 }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onDown("r")(e);
            }}
          />
        </div>
      </div>
      <div className="mono text-[10px] w-20 text-right" style={{ color: "var(--text-faint)" }}>
        {Math.round((value[1] - value[0]) * data.length)}h
      </div>
    </div>
  );
}
