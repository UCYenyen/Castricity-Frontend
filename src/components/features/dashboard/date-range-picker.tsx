"use client";
import { useState } from "react";
import type { DateRange, Matcher } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

interface Props {
  value: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (d: Date) => `${d.getDate()} ${MONTH[d.getMonth()]} ${d.getFullYear()}`;

export function DateRangePicker({ value, onChange, minDate, maxDate, className }: Props) {
  const [open, setOpen] = useState(false);

  const label = !value?.from
    ? "Pick a range"
    : value.to
    ? `${fmt(value.from)} – ${fmt(value.to)}`
    : fmt(value.from);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`mono h-8 gap-2 text-xs font-medium ${className ?? ""}`}
        >
          <CalendarIcon size={14} />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={value}
          onSelect={onChange}
          disabled={
            [
              minDate ? { before: minDate } : null,
              maxDate ? { after: maxDate } : null,
            ].filter(Boolean) as Matcher[]
          }
          defaultMonth={value?.from ?? maxDate}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
