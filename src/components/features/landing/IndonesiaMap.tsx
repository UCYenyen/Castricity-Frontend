import React from 'react';

export function IndonesiaMap({ className }: { className?: string }) {
  return (
    <div className={`relative w-full max-w-4xl mx-auto opacity-80 ${className}`}>
      {/* SVG Map of Indonesia (Simplified/Abstracted for tech vibe) */}
      <svg
        viewBox="0 0 1000 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        style={{
          filter: "drop-shadow(0 0 15px rgba(6, 182, 212, 0.4)) drop-shadow(0 0 50px rgba(6, 182, 212, 0.1))",
        }}
      >
        {/* Simplified paths for major islands */}
        <g stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(6, 182, 212, 0.05)">
          {/* Sumatra */}
          <path d="M120,50 L140,80 L200,160 L240,240 L280,290 L260,300 L200,240 L140,160 L100,100 Z" />
          {/* Java */}
          <path d="M280,310 L340,320 L400,325 L480,330 L520,320 L540,330 L480,350 L400,345 L340,340 L280,325 Z" />
          {/* Kalimantan */}
          <path d="M360,180 L420,120 L480,100 L540,140 L520,200 L480,240 L400,240 L340,200 Z" />
          {/* Sulawesi */}
          <path d="M580,160 L620,160 L640,200 L620,240 L600,280 L560,260 L580,220 L560,180 Z" />
          <path d="M620,160 L660,140 L700,160 L660,180 Z" />
          <path d="M640,200 L680,220 L660,240 Z" />
          {/* Papua */}
          <path d="M780,200 L840,160 L920,180 L960,220 L940,280 L880,300 L820,260 L760,240 Z" />
          {/* Nusa Tenggara / Bali */}
          <path d="M560,330 L600,340 L640,335 L680,345 L640,350 L600,355 L560,345 Z" />
          {/* Maluku */}
          <path d="M720,180 L740,200 L720,220 Z" />
          <path d="M700,240 L720,260 L700,280 Z" />
        </g>

        {/* Network Nodes (Glowing Dots) */}
        <g fill="#22d3ee">
          <circle cx="160" cy="120" r="4" className="animate-pulse" />
          <circle cx="220" cy="200" r="3" />
          <circle cx="270" cy="295" r="5" className="animate-pulse" />
          <circle cx="380" cy="325" r="6" style={{ animationDelay: '0.5s' }} className="animate-pulse" />
          <circle cx="480" cy="335" r="4" />
          <circle cx="520" cy="325" r="5" className="animate-pulse" />
          <circle cx="440" cy="180" r="4" />
          <circle cx="600" cy="200" r="3" style={{ animationDelay: '1s' }} className="animate-pulse" />
          <circle cx="840" cy="220" r="4" />
          <circle cx="620" cy="340" r="3" />
        </g>

        {/* Connection Lines */}
        <g stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" strokeDasharray="4 4">
          <line x1="160" y1="120" x2="220" y2="200" />
          <line x1="220" y1="200" x2="270" y2="295" />
          <line x1="270" y1="295" x2="380" y2="325" />
          <line x1="380" y1="325" x2="480" y2="335" />
          <line x1="480" y1="335" x2="520" y2="325" />
          <line x1="380" y1="325" x2="440" y2="180" />
          <line x1="440" y1="180" x2="600" y2="200" />
          <line x1="520" y1="325" x2="620" y2="340" />
          <line x1="600" y1="200" x2="840" y2="220" />
        </g>
      </svg>
    </div>
  );
}
