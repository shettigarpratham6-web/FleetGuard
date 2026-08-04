import React from 'react';

export default function SummaryCard({ title, value, icon, variant }: any) {
  let baseColors = 'border-l-blue-600 ring-blue-500';
  let iconColor = 'text-blue-500';
  let bgColors = 'bg-white';

  if (variant === 'success') {
    baseColors = 'border-l-[#10b981] ring-[#10b981]';
    iconColor = 'text-[#10b981]';
  } else if (variant === 'warning') {
    baseColors = 'border-l-[#f59e0b] ring-[#f59e0b]';
    iconColor = 'text-[#f59e0b]';
    if (title === 'Medium Risk') {
       bgColors = 'bg-[#fffbf0] border-y border-r border-[#fcd34d]';
    }
  } else if (variant === 'danger') {
    baseColors = 'border-l-[#ef4444] ring-[#ef4444]';
    iconColor = 'text-[#ef4444]';
  }

  return (
    <div className={`${bgColors} rounded-xl shadow-sm p-5 border-l-[6px] ${baseColors} border-y border-r border-slate-200 transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-1">
        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">{title}</p>
        <span className={iconColor}>{icon}</span>
      </div>
      <h3 className="text-3xl font-black text-slate-800">{value}</h3>
    </div>
  );
}
