"use client";
import { useEffect, useRef, useState } from "react";

export interface Size {
  w: number;
  h: number;
}

export function useElementSize<T extends HTMLElement>(initial: Size = { w: 800, h: 320 }) {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size>(initial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(360, r.width), h: Math.max(260, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}
