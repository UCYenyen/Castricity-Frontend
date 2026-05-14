const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export function fmtTime(d: Date, opts: { withDate?: boolean } = {}): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (opts.withDate) {
    return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${hh}:${mm}`;
  }
  return `${hh}:${mm}`;
}

export function fmtMW(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function fmtSigned(n: number, dec = 2): string {
  return (n >= 0 ? "+" : "") + n.toFixed(dec);
}

export const DAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
