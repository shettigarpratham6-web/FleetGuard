import React, { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

export default function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorMap: Record<string, string> = {
    sky: 'bg-sky-100 text-sky-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    rose: 'bg-rose-100 text-rose-600',
    amber: 'bg-amber-100 text-amber-600',
    violet: 'bg-violet-100 text-violet-600',
    red: 'bg-red-100 text-red-600'
  };
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
      </div>
      <div className={`p-4 rounded-full ${colorMap[color] || 'bg-slate-100 text-slate-600'}`}>
        {icon}
      </div>
    </div>
  );
}
