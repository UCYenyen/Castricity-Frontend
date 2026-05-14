"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Activity, ShieldCheck, Zap, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40 min-h-[800px] flex items-center bg-[#050a15]">
      {/* Background Flowing Energy Waves & Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Animated Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-accent-cyan"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              opacity: 0,
              animation: `particle-drift ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
              boxShadow: "0 0 10px rgba(6, 182, 212, 0.8)",
            }}
          />
        ))}

        <div 
          className="absolute top-1/4 left-0 right-0 h-64 bg-accent-cyan/10 blur-[100px] rounded-[100%]"
          style={{ animation: 'glow-breathe 8s ease-in-out infinite' }}
        />
        <div 
          className="absolute bottom-1/4 left-1/4 right-1/4 h-48 bg-accent-purple/10 blur-[120px] rounded-[100%]"
          style={{ animation: 'glow-breathe 10s ease-in-out infinite reverse' }}
        />
        
        {/* SVG Waves */}
        <svg className="absolute w-[200%] h-full top-0 left-[-50%] opacity-20" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path 
            d="M0,400 Q250,500 500,400 T1000,400 T1500,400 T2000,400" 
            fill="none" 
            stroke="var(--accent-cyan)" 
            strokeWidth="2" 
            style={{ animation: 'energy-flow 15s linear infinite' }} 
          />
          <path 
            d="M0,600 Q250,500 500,600 T1000,600 T1500,600 T2000,600" 
            fill="none" 
            stroke="var(--accent-cyan)" 
            strokeWidth="1" 
            style={{ animation: 'energy-flow-reverse 20s linear infinite', opacity: 0.5 }} 
          />
        </svg>
        
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#050a15]/80 to-[#050a15]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        
        <div className="text-center mb-16 relative z-20">
          <h1 className="mx-auto max-w-5xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl mb-8 animate-reveal-up">
            Prediksi Beban Listrik Nasional, <span className="text-glow-cyan text-accent-cyan">Didukung AI</span>
          </h1>
          
          {/* Trust Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12 animate-reveal-up delay-100">
            <div className="trust-pill">
              <Zap size={14} /> 98.48% Akurasi
            </div>
            <div className="trust-pill">
              <ShieldCheck size={14} /> 100% Offline-Ready
            </div>
            <div className="trust-pill">
              <Database size={14} /> ESDM-Grade
            </div>
          </div>
        </div>

        {/* Hero Central Map Area */}
        <div className="relative w-full max-w-5xl mx-auto h-[400px] sm:h-[500px] group perspective-1000">
          {/* Central Map */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-2xl transform transition-transform duration-700 group-hover:scale-[1.02]">
            {/* The provided image */}
            <div className="relative w-full max-w-4xl opacity-90 mix-blend-screen drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
              <img 
                src="/indonesia-map.png" 
                alt="Peta Jaringan Listrik Indonesia" 
                className="w-full h-auto object-contain animate-pulse"
                style={{ animationDuration: '4s' }}
              />
              {/* Holographic Scanner overlay on the map */}
              <div className="holo-scanner" />
            </div>
          </div>

          {/* Floating Data Cards */}
          <div 
            className="absolute top-[10%] left-[5%] glass-card p-4 hidden md:block"
            style={{ animation: 'float-slow 6s ease-in-out infinite' }}
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Akurasi Sistem</div>
            <div className="text-2xl font-bold text-white font-mono">98.48%</div>
            <div className="w-full bg-accent-cyan/20 h-1 mt-2 rounded-full overflow-hidden">
              <div className="bg-accent-cyan h-full w-[98.48%]" />
            </div>
          </div>

          <div 
            className="absolute bottom-[20%] left-[10%] glass-card p-4 hidden sm:block"
            style={{ animation: 'float-medium 7s ease-in-out infinite 1s' }}
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prediksi Aktif</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="pulse-dot" style={{ width: 8, height: 8 }} />
              1,250+
            </div>
            <div className="text-[10px] text-text-faint mt-1">Diperbarui setiap jam</div>
          </div>

          <div 
            className="absolute top-[30%] right-[5%] glass-card p-4 hidden md:block"
            style={{ animation: 'float-slow 8s ease-in-out infinite 0.5s' }}
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status Grid</div>
            <div className="flex items-center gap-2 text-accent-green font-bold text-xl">
              <Activity size={20} />
              Stabil
            </div>
            <div className="text-xs text-text-secondary mt-1">Anomali Terdeteksi: 0</div>
          </div>

          <div 
            className="absolute bottom-[10%] right-[15%] glass-card p-4 border-accent-cyan/40"
            style={{ animation: 'float-medium 6.5s ease-in-out infinite 2s' }}
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Trend Permintaan</div>
            <svg width="120" height="40" viewBox="0 0 120 40">
              <path d="M0,35 Q30,25 60,30 T120,5" fill="none" stroke="#06b6d4" strokeWidth="2" />
              <path d="M0,40 L0,35 Q30,25 60,30 T120,5 L120,40 Z" fill="rgba(6, 182, 212, 0.1)" />
            </svg>
          </div>
        </div>
        
        {/* CTAs */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 relative z-20 animate-reveal-up delay-200">
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-10 text-base font-bold bg-accent-cyan text-[#050a15] hover:bg-accent-cyan-2 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all w-full sm:w-auto rounded-full">
              Buka Command Center <ArrowRight className="ml-2 size-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="h-14 px-10 text-base font-medium border-border/50 bg-white/5 hover:bg-white/10 backdrop-blur w-full sm:w-auto rounded-full text-white">
              Pelajari Fitur
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
