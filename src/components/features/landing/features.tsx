"use client";
import { useEffect, useRef, useState } from "react";
import { Activity, BrainCircuit, ShieldAlert, TrendingUp, Cpu, Network, CheckCircle2, Server, Database } from "lucide-react";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add("visible");
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function Features() {
  const revealRef1 = useScrollReveal();
  const revealRef2 = useScrollReveal();
  const revealRef3 = useScrollReveal();

  return (
    <div className="bg-[#050a15] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[800px] bg-accent-cyan/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ===== BENTO GRID SECTION ===== */}
      <section id="features" className="py-24 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div ref={revealRef1} className="scroll-reveal text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Infrastruktur Prediksi Skala Nasional
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Dibangun untuk keandalan tingkat tinggi. Menggabungkan Machine Learning canggih dengan keamanan infrastruktur tanpa kompromi.
            </p>
          </div>

          <div ref={revealRef3} className="bento-grid stagger-reveal-grid">
            
            {/* Card 1: Why Castricity (Span 2) */}
            <div className="bento-span-2 glass-card p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Server size={120} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                  <ShieldAlert size={24} />
                </div>
                Mengapa Castricity?
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md relative z-10">
                Memprediksi kebutuhan listrik negara bukan sekadar menebak tren. Castricity menggunakan <strong>Sistem AI Hybrid</strong> untuk mengolah jutaan titik data cuaca dan ekonomi. Di balik layar, mesin pintar <em>(Prophet & LightGBM)</em> memastikan stabilitas grid, sementara teknologi <em>SHAP</em> menjamin setiap keputusan dapat diaudit secara transparan.
              </p>
              <ul className="mt-6 space-y-3 relative z-10">
                {['Tanpa Ketergantungan Cloud Asing', 'Deteksi Anomali Otomatis', 'Auditabilitas Penuh'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                    <CheckCircle2 size={16} className="text-accent-green" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 2: Radial Dial */}
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center group">
              <div className="relative size-40 mb-6 flex items-center justify-center">
                {/* SVG Radial Progress */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(6,182,212,0.1)" strokeWidth="6" />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="#06b6d4" 
                    strokeWidth="6" 
                    strokeDasharray="283" 
                    strokeDashoffset="283"
                    strokeLinecap="round"
                    style={{ animation: 'dash 2s ease-out forwards 0.5s' }}
                  />
                  <style>{`@keyframes dash { to { stroke-dashoffset: 4.3; } }`}</style>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white font-mono" style={{ animation: 'count-pulse 2s ease-out' }}>98.4<span className="text-accent-cyan">%</span></span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Tingkat Akurasi</h3>
              <p className="text-xs text-muted-foreground">Tervalidasi pada data beban listrik historis (MAPE: 1.52%)</p>
            </div>

            {/* Card 3: ML Pipeline */}
            <div className="glass-card p-8 group">
              <h3 className="text-lg font-bold text-white mb-6">Pipeline Pintar</h3>
              <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-border -translate-y-1/2 z-0" />
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-cyan/0 via-accent-cyan to-accent-cyan/0 -translate-y-1/2 z-0 opacity-50" style={{ animation: 'shimmer 2s infinite linear' }} />
                
                {/* Nodes */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#0a1224] border border-border group-hover:border-accent-cyan/50 transition-colors">
                    <Database size={20} className="text-muted-foreground group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Data</span>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="p-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan text-accent-cyan shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <BrainCircuit size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent-cyan">AI Core</span>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#0a1224] border border-border group-hover:border-accent-green/50 transition-colors">
                    <TrendingUp size={20} className="text-muted-foreground group-hover:text-accent-green transition-colors" />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Aksi</span>
                </div>
              </div>
              <p className="text-xs text-text-faint mt-6 text-center leading-relaxed">
                Memproses data suhu, curah hujan, dan makroekonomi secara real-time dengan perlindungan <strong>Zero Data Leakage</strong> dan deteksi anomali otomatis.
              </p>
            </div>

            {/* Card 4: Mini Chart (Span 2) */}
            <div className="bento-span-2 glass-card p-8 group">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity size={18} className="text-accent-cyan" />
                  Optimasi Jaringan Real-time
                </h3>
                <span className="text-xs font-mono text-accent-cyan px-2 py-1 rounded bg-accent-cyan/10 border border-accent-cyan/20">LIVE</span>
              </div>
              
              <div className="relative h-40 w-full rounded-lg border border-border/50 bg-[#0a1224] overflow-hidden">
                {/* Mock Chart SVG */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  {/* Grid lines */}
                  <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  
                  {/* Chart Line */}
                  <path d="M0,80 L10,75 L20,60 L30,65 L40,40 L50,45 L60,20 L70,30 L80,10 L90,15 L100,5" fill="none" stroke="#06b6d4" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <path d="M0,100 L0,80 L10,75 L20,60 L30,65 L40,40 L50,45 L60,20 L70,30 L80,10 L90,15 L100,5 L100,100 Z" fill="url(#chartGrad)" />
                  
                  <defs>
                    <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(6,182,212,0.3)" />
                      <stop offset="100%" stopColor="rgba(6,182,212,0)" />
                    </linearGradient>
                  </defs>
                  
                  {/* Data Points */}
                  <circle cx="40" cy="40" r="1.5" fill="#fff" />
                  <circle cx="60" cy="20" r="1.5" fill="#fff" />
                  <circle cx="80" cy="10" r="1.5" fill="#fff" />
                  
                  {/* Highlight Point */}
                  <circle cx="80" cy="10" r="3" fill="#06b6d4" className="animate-pulse" />
                </svg>
                
                {/* Tooltip mockup */}
                <div className="absolute top-2 right-1/4 bg-popover border border-border text-xs px-2 py-1 rounded shadow-lg backdrop-blur">
                  <span className="text-muted-foreground">Beban: </span>
                  <span className="text-white font-mono">12.4 GW</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== DASHBOARD SHOWCASE SECTION ===== */}
      <section ref={revealRef2} className="scroll-reveal py-24 border-y border-border/30 bg-black/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Platform Kelas Enterprise
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Satu command center terpadu untuk analitik historis, prediksi real-time, dan manajemen anomali.
            </p>
          </div>

          {/* Glowing Mockup Frame */}
          <div className="relative mx-auto max-w-5xl group perspective-1000">
            {/* Glow Behind */}
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan/30 via-accent-purple/20 to-accent-green/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            
            <div className="relative gradient-border-card bg-[#050a15] rounded-xl overflow-hidden shadow-2xl transition-transform duration-700 ease-out transform group-hover:scale-[1.01] group-hover:-translate-y-2">
              {/* Browser Bar */}
              <div className="h-10 border-b border-border/50 bg-[#0a1224] flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-accent-red/80" />
                  <div className="size-3 rounded-full bg-accent-orange/80" />
                  <div className="size-3 rounded-full bg-accent-green/80" />
                </div>
                <div className="mx-auto h-6 w-64 bg-[#050a15] rounded-md border border-border/50 flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                  app.castricity.gov.id
                </div>
              </div>
              
              {/* Mockup Content (Simulating Dashboard) */}
              <div className="p-6 grid grid-cols-4 gap-6 h-[500px]">
                {/* Sidebar */}
                <div className="col-span-1 border-r border-border/50 pr-4 flex flex-col gap-4">
                  <div className="h-8 w-24 bg-accent-cyan/10 rounded border border-accent-cyan/20" />
                  <div className="h-8 w-full bg-white/5 rounded" />
                  <div className="h-8 w-full bg-white/5 rounded" />
                  <div className="h-8 w-full bg-white/5 rounded" />
                </div>
                
                {/* Main Content */}
                <div className="col-span-3 flex flex-col gap-6">
                  {/* Top Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-white/5 rounded-xl border border-border/50" />
                    <div className="h-24 bg-white/5 rounded-xl border border-border/50" />
                    <div className="h-24 bg-white/5 rounded-xl border border-border/50" />
                  </div>
                  {/* Main Chart */}
                  <div className="flex-1 bg-[#0a1224] rounded-xl border border-border/50 relative overflow-hidden">
                     {/* Decorative Chart lines inside mockup */}
                     <svg className="absolute inset-x-0 bottom-0 w-full h-2/3" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,100 L10,80 L20,85 L30,60 L40,70 L50,40 L60,50 L70,20 L80,30 L90,10 L100,5 L100,100 Z" fill="rgba(6,182,212,0.05)" />
                        <path d="M0,100 L10,80 L20,85 L30,60 L40,70 L50,40 L60,50 L70,20 L80,30 L90,10 L100,5" fill="none" stroke="#06b6d4" strokeWidth="1" />
                     </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
