"use client";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface SegmentOption<T extends string | number> {
  v: T;
  l: string;
}

interface Props<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}

export function Segmented<T extends string | number>({
  options, value, onChange, ariaLabel,
}: Props<T>) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={String(value)}
      onValueChange={(v) => {
        if (!v) return;
        const match = options.find((o) => String(o.v) === v);
        if (match) onChange(match.v);
      }}
      aria-label={ariaLabel}
    >
      {options.map((o) => (
        <ToggleGroupItem key={String(o.v)} value={String(o.v)} className="text-xs">
          {o.l}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
