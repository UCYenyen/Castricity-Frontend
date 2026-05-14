"use client";
import { useEffect, useRef, useState } from "react";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) setVisible(true);

      // Use requestAnimationFrame for buttery smooth performance
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (glowRef.current) {
          glowRef.current.style.setProperty("--x", `${targetX}px`);
          glowRef.current.style.setProperty("--y", `${targetY}px`);
        }
      });
    };

    const handleMouseLeave = () => setVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [visible]);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-500"
      style={{
        opacity: visible ? 1 : 0,
        background: `radial-gradient(800px circle at var(--x, 50vw) var(--y, 50vh), rgba(6, 182, 212, 0.12), transparent 40%)`,
      }}
    />
  );
}
