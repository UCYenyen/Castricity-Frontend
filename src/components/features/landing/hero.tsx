"use client";
import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ShapeGrid from "./ShapeGrid";
import { useEffect, useRef, useState } from "react";

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const steps = 60;
          const inc = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += inc;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            setCount(Math.round(current * 100) / 100);
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  const formatted =
    target % 1 !== 0 ? count.toFixed(2) : count.toLocaleString();
  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40 min-h-[600px] flex items-center">
      <div className="absolute inset-0 z-0">
        <ShapeGrid
          direction="diagonal"
          speed={0.15}
          squareSize={48}
          borderColor="rgba(148, 163, 184, 0.1)"
          hoverFillColor="rgba(6, 182, 212, 0.15)"
          shape="square"
          hoverTrailAmount={3}
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/60 to-background pointer-events-none" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10 text-center">
        <Badge
          variant="outline"
          className="mb-6 rounded-full border-accent-cyan/30 bg-accent-cyan/10 px-4 py-1.5 text-accent-cyan-2 uppercase tracking-widest text-[10px] font-bold"
        >
          <span className="pulse-dot mr-2" style={{ width: 6, height: 6 }} />
          Platform Prakiraan Listrik Indonesia
        </Badge>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Lindungi Jaringan.{" "}
          <span className="text-accent-cyan">Cegah Pemadaman.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Castricity membantu PLN dan pengambil keputusan memprediksi kebutuhan
          listrik nasional dengan akurasi tinggi — dan{" "}
          <strong className="text-foreground">
            menjelaskan alasan di balik setiap prediksi
          </strong>
          , sehingga setiap keputusan investasi triliunan rupiah dapat
          dipertanggungjawabkan.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              Lihat Dashboard <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
          <Link
            href="https://github.com/UCYenyen/Castricity-Frontend.git"
            target="_blank"
          >
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-medium w-full sm:w-auto"
            >
              Pelajari Lebih Lanjut
            </Button>
          </Link>
        </div>

        {/* Trust indicators for government audience */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            {
              value: 1.52,
              suffix: "%",
              label: "Akurasi Prediksi (MAPE)",
              icon: Zap,
            },
            {
              value: 38,
              suffix: "",
              label: "Provinsi (Roadmap)",
              icon: Globe,
            },
            {
              value: 100,
              suffix: "%",
              label: "Offline — Tanpa Cloud",
              icon: Shield,
            },
            {
              value: 2,
              suffix: " detik",
              prefix: "<",
              label: "Waktu Analisis",
              icon: Zap,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card/40 backdrop-blur p-4 text-center"
            >
              <div className="text-2xl font-bold text-accent-cyan font-mono tracking-tight">
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
