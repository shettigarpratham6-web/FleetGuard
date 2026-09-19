import React from 'react';

export default function RiskBadge({ risk }: { risk: string }) {
  const isHigh = risk === 'HIGH';
  const isMedium = risk === 'MEDIUM';
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
      isHigh ? 'bg-red-50 text-red-700 border-red-200' : 
      isMedium ? 'bg-amber-50 text-amber-700 border-amber-200' : 
      'bg-emerald-50 text-emerald-700 border-emerald-200'
    }`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
      {risk}
    </span>
  );
}
