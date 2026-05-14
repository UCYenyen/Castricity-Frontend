"use client";
import Link from "next/link";
import { ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ShapeGrid from "./ShapeGrid";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40 min-h-[600px] flex items-center">
      {/* Decorative background elements */}
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
        <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/60 to-background pointer-events-none"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10 text-center">
        <Badge variant="outline" className="mb-6 rounded-full border-accent-cyan/30 bg-accent-cyan/10 px-4 py-1.5 text-accent-cyan-2 uppercase tracking-widest text-[10px] font-bold">
          <span className="pulse-dot mr-2" style={{ width: 6, height: 6 }} />
          Castricity XAI
        </Badge>
        
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Forecast Electricity{" "}
          <span className="text-accent-cyan">
            Demand
          </span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Unleash the power of AI-driven electricity demand forecasting. Castricity provides 
          operations dashboards, anomaly detection, and explainable AI insights 
          for modern grid management.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
              View Dashboard <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
