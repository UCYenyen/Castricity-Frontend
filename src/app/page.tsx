"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { Activity, Thermometer, ShieldAlert, Zap, GitBranch, ArrowRight } from "lucide-react";

const mockForecastData = [
  { time: "00:00", actual: 7200, predicted: 7150, lower: 7000, upper: 7300 },
  { time: "04:00", actual: 6800, predicted: 6900, lower: 6750, upper: 7050 },
  { time: "08:00", actual: 7600, predicted: 7550, lower: 7400, upper: 7700 },
  { time: "12:00", actual: 7900, predicted: 7850, lower: 7700, upper: 8000 },
  { time: "16:00", actual: 8100, predicted: 8050, lower: 7900, upper: 8200 },
  { time: "20:00", actual: 8300, predicted: 8250, lower: 8100, upper: 8400 },
  { time: "00:00", actual: null, predicted: 7450, lower: 7300, upper: 7600 },
];

const shapData = [
  { feature: "Avg Temp", impact: 150 },
  { feature: "Is Weekend", impact: -300 },
  { feature: "Lag 1 Demand", impact: 400 },
  { feature: "Is Holiday", impact: -450 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F9FAFB] font-sans selection:bg-[#3B82F6] selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full border-b border-[#1F2937]/50 bg-[#0B1120]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center font-bold">
              ⚡
            </div>
            <span className="font-bold text-xl tracking-tight">Castricity</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-[#9CA3AF]">
            <a href="#features" className="hover:text-white transition-colors">Architecture</a>
            <a href="#api" className="hover:text-white transition-colors">API Docs</a>
            <div className="flex items-center gap-2 bg-[#1F2937]/50 px-3 py-1.5 rounded-full border border-[#374151]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-mono text-xs">API: ONLINE</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Text */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] text-sm font-mono">
                <GitBranch className="w-4 h-4" /> v2.4 Prophet-LGBM Hybrid Live
              </div>
              <h1 className="text-6xl font-extrabold leading-tight tracking-tight">
                Predict the Grid.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-green-400">
                  Prevent the Blackout.
                </span>
              </h1>
              <p className="text-xl text-[#9CA3AF] max-w-lg leading-relaxed">
                National electricity demand forecasting powered by Joint Bayesian Optimization. Combines Prophet baseline with LightGBM residuals and Isolation Forest guardrails.
              </p>
              <div className="flex gap-4">
                <button className="bg-[#3B82F6] hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  Launch Dashboard <ArrowRight className="w-4 h-4" />
                </button>
                <button className="bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white px-6 py-3 rounded-lg font-semibold transition-all">
                  Read Whitepaper
                </button>
              </div>
            </div>

            {/* Right: Chart Terminal */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#3B82F6] to-green-400 rounded-xl blur opacity-20 animate-pulse"></div>
              <div className="relative bg-[#111827]/90 backdrop-blur-xl border border-[#374151] rounded-xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-mono text-sm text-[#9CA3AF] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" /> /api/forecast/48h
                  </h3>
                  <span className="font-mono text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">RMSE: 1.2%</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockForecastData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                      <XAxis dataKey="time" stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#F9FAFB' }}
                      />
                      <Area type="monotone" dataKey="upper" stroke="none" fill="#3B82F6" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="lower" stroke="none" fill="#0B1120" fillOpacity={1} />
                      <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} name="Actual" />
                      <Line type="monotone" dataKey="predicted" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#1F2937]">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Enterprise-Grade ML Pipeline</h2>
            <p className="text-[#9CA3AF] max-w-2xl mx-auto">Castricity replaces black-box models with a transparent, decoupled Hybrid Trinity architecture designed specifically for grid dynamics.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Feature 1: What-If Simulator */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 hover:border-[#3B82F6]/50 transition-colors group">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Thermometer className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">What-If Simulation</h3>
              <p className="text-[#9CA3AF] text-sm mb-6">Real-time inference engine. Tweak exogenous variables like temperature and rainfall to simulate load spikes instantly.</p>
              <div className="bg-[#0B1120] rounded-lg p-4 font-mono text-xs text-[#6B7280]">
                <div className="flex justify-between mb-2"><span>Avg_Temp</span><span className="text-blue-400">32.5°C</span></div>
                <div className="w-full bg-[#1F2937] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-400 w-3/4 h-full"></div>
                </div>
              </div>
            </div>

            {/* Feature 2: Anomaly Guardrails */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 hover:border-red-500/50 transition-colors group">
              <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Anomaly Guardrails</h3>
              <p className="text-[#9CA3AF] text-sm mb-6">Isolation Forest spatial trees automatically detect black-swan events and impute missing data using 7-day trailing means.</p>
              <div className="bg-[#0B1120] rounded-lg p-4 font-mono text-xs flex items-center justify-between">
                <span className="text-red-400 flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Outlier Detected</span>
                <span className="text-[#6B7280]">Auto-Imputing</span>
              </div>
            </div>

            {/* Feature 3: SHAP Explainability */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 hover:border-green-500/50 transition-colors group">
              <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">SHAP Explainability</h3>
              <p className="text-[#9CA3AF] text-sm mb-6">Zero black-box AI. Every prediction is decomposed into precise megawatt contributions via Shapley Additive Explanations.</p>
              <div className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="feature" type="category" hide />
                    <Bar dataKey="impact" radius={2}>
                      {shapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#10B981' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1F2937] bg-[#0B1120] py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs">⚡</div>
              <span className="font-bold text-lg">Castricity</span>
            </div>
            <p className="text-[#6B7280] text-sm max-w-sm">The Explainable Oracle. Developed for the FindIT hackathon to bring transparent, high-accuracy AI to national power grids.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#F9FAFB]">Resources</h4>
            <ul className="space-y-2 text-sm text-[#9CA3AF]">
              <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Whitepaper</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GitHub Repository</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#F9FAFB]">System Status</h4>
            <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-[#6B7280]">Inference Engine</span>
                <span className="text-green-400 font-mono">99.9% Uptime</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6B7280]">Last Trained</span>
                <span className="text-[#F9FAFB] font-mono">2 hrs ago</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
