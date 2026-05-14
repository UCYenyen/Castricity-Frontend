"use client";
import { Checkbox } from "@/components/ui/checkbox";
import type { ReactNode } from "react";

interface LegendItemProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  swatch: ReactNode;
  label: string;
  disabled?: boolean;
}

export function LegendItem({ checked, onChange, swatch, label, disabled }: LegendItemProps) {
  return (
    <label
      className="inline-flex items-center gap-2 text-[11.5px] cursor-pointer select-none"
      style={{ color: "var(--text-secondary)" }}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v: boolean | "indeterminate") => onChange(!!v)}
        className="size-3.5"
      />
      {swatch}
      {label}
    </label>
  );
}

export function Swatch({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 14,
        height: 3,
        borderRadius: 2,
        background: color,
        display: "inline-block",
      }}
    />
  );
}

export function SwatchDashed({ color = "var(--accent-green)" }: { color?: string }) {
  return (
    <span
      style={{
        width: 14,
        height: 0,
        borderTop: `2px dashed ${color}`,
        display: "inline-block",
      }}
    />
  );
}

export function SwatchBand() {
  return (
    <span
      style={{
        width: 14,
        height: 8,
        borderRadius: 2,
        background: "rgba(6,182,212,0.18)",
        border: "1px solid rgba(6,182,212,0.35)",
        display: "inline-block",
      }}
    />
  );
}
