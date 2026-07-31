'use client';

import React from 'react';

export default function HeroBackground() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0e17] font-sans">

      {/* === CSS-only Animated Background === */}

      {/* Layer 1: Deep radial base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(220,38,38,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 75% 70%, rgba(30,58,138,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 100% 80% at 50% 0%, rgba(15,23,42,0.95) 0%, #0a0e17 80%)
          `,
        }}
      />

      {/* Layer 2: Animated glowing orb (top-left, red accent) */}
      <div
        className="absolute rounded-full blur-3xl opacity-30 animate-pulse"
        style={{
          width: '520px',
          height: '520px',
          top: '-120px',
          left: '-100px',
          background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, rgba(185,28,28,0.2) 50%, transparent 70%)',
          animationDuration: '4s',
        }}
      />

      {/* Layer 3: Animated glowing orb (bottom-right, blue accent) */}
      <div
        className="absolute rounded-full blur-3xl opacity-20 animate-pulse"
        style={{
          width: '600px',
          height: '600px',
          bottom: '-150px',
          right: '-150px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(29,78,216,0.2) 50%, transparent 70%)',
          animationDuration: '6s',
          animationDelay: '2s',
        }}
      />

      {/* Layer 4: Subtle mid-screen orb (center) */}
      <div
        className="absolute rounded-full blur-2xl opacity-10 animate-pulse"
        style={{
          width: '350px',
          height: '350px',
          top: '40%',
          left: '45%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(239,68,68,0.35) 0%, transparent 70%)',
          animationDuration: '8s',
          animationDelay: '1s',
        }}
      />

      {/* Layer 5: Diagonal gradient stripe */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: 'linear-gradient(125deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(239,68,68,0.04) 100%)',
        }}
      />

      {/* Layer 6: Semi-circular arc overlay (left edge) */}
      <div
        className="pointer-events-none absolute -left-32 -top-20 border-r border-white/10 backdrop-blur-[1px]"
        style={{
          width: '50%',
          height: '120%',
          borderRadius: '0 100% 100% 0',
          background: 'linear-gradient(to right, rgba(255,255,255,0.025), rgba(255,255,255,0.005))',
        }}
      />

      {/* Layer 7: Dot-matrix grid */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Layer 8: Horizontal scanline texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
        }}
      />

      {/* Layer 9: Vignette edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)
          `,
        }}
      />

      {/* Decorative Dot Matrix Grid (Bottom-Left ornament) */}
      <div className="pointer-events-none absolute bottom-16 left-1/3 -translate-x-1/2 opacity-25">
        <div className="grid grid-cols-8 gap-2.5">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-white" />
          ))}
        </div>
      </div>

      {/* Decorative Dot Pattern Overlay (Center/Hero) */}
      <div className="pointer-events-none absolute left-[38%] top-[30%] opacity-15">
        <div className="grid grid-cols-12 gap-3">
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-white" />
          ))}
        </div>
      </div>

      {/* Triple Arrow Chevron Indicators */}
      <div className="absolute left-[54%] top-1/2 -translate-y-1/2 opacity-40 text-white font-black text-4xl tracking-tight select-none">
        &#171;&#171;&#171;&#171;
      </div>

    </div>
  );
}
