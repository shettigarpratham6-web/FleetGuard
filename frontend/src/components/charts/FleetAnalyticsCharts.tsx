import React from 'react';

interface FleetAnalyticsChartsProps {
  metrics?: {
    totalVehicles?: number;
    compliantVehicles?: number;
    expiredVehicles?: number;
    upcomingExpiryVehicles?: number;
    totalMaintenanceCost?: number;
    highRiskVehicles?: number;
  };
  predictiveData?: any[];
}

export default function FleetAnalyticsCharts({ metrics, predictiveData }: FleetAnalyticsChartsProps) {
  const total = metrics?.totalVehicles || 0;
  const compliant = metrics?.compliantVehicles || 0;
  const expired = metrics?.expiredVehicles || 0;
  const upcoming = metrics?.upcomingExpiryVehicles || 0;

  // Active percentage computed directly from backend vehicle compliance: (compliant / total) * 100
  const activePercentage = total > 0 ? Math.round((compliant / total) * 100) : 100;

  // Calculate dynamic pie chart conic gradient stops based on backend metrics ratios
  const compDeg = total > 0 ? (compliant / total) * 360 : 360;
  const updeg   = total > 0 ? (upcoming / total) * 360 : 0;
  const expDeg  = total > 0 ? (expired / total) * 360 : 0;

  const pieGradient = total > 0
    ? `conic-gradient(#10b981 0deg ${compDeg}deg, #f59e0b ${compDeg}deg ${compDeg + updeg}deg, #ef4444 ${compDeg + updeg}deg 360deg)`
    : 'conic-gradient(#10b981 0deg 360deg)';

  // Daily service volume calculated dynamically from backend service records
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate last 7 days dynamically
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    const label = `${dayNames[d.getDay()]} ${d.getDate()}`;
    return {
      dateStr: dayStr,
      label,
      count: 0
    };
  });

  const records = predictiveData || [];
  records.forEach((rec: any) => {
    if (rec.service_date) {
      const recDate = String(rec.service_date).slice(0, 10);
      const match = last7Days.find(d => d.dateStr === recDate);
      if (match) {
        match.count++;
      }
    }
  });

  const maxVal = Math.max(...last7Days.map(d => d.count), 1);

  const dailyVolume = last7Days.map(d => ({
    day: d.label,
    date: d.dateStr,
    val: d.count,
    heightPct: Math.max(15, Math.round((d.count / maxVal) * 100))
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {/* Daily Service Activity (Day Chart) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">bar_chart</span>
              Daily Maintenance Volume (7-Day Activity)
            </h3>
            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full uppercase border border-blue-200 tracking-wider">
              Day-by-Day Timeline
            </span>
          </div>

          <div className="h-60 w-full flex items-end justify-between gap-3 border-b border-slate-100 pb-2 px-2">
            {dailyVolume.map((item, i) => (
              <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                <div 
                  className="w-full max-w-[36px] bg-gradient-to-t from-blue-600 via-indigo-500 to-sky-400 hover:from-blue-700 hover:to-indigo-600 rounded-t-xl transition-all duration-300 shadow-md group-hover:shadow-lg cursor-pointer" 
                  style={{ height: `${item.heightPct}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl pointer-events-none whitespace-nowrap z-20">
                    {item.val} Services ({item.date})
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 px-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
            {dailyVolume.map((item, i) => (
              <span key={i} className="flex-1 text-center">{item.day}</span>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 font-semibold mt-4 text-center">
          Real-time daily service volume computed directly from backend service records.
        </p>
      </div>

      {/* Fleet Compliance & Status Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">pie_chart</span>
            Fleet Health & Compliance Breakdown
          </h3>
          <div className="h-60 flex items-center justify-center">
            <div 
              className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-md transition-all"
              style={{ background: pieGradient }}
            >
              <div className="w-34 h-34 rounded-full bg-white flex flex-col items-center justify-center shadow-inner text-center p-2">
                <p className="text-3xl font-black text-slate-900 tracking-tight">{activePercentage}%</p>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-0.5">Compliant</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1">({compliant} of {total} Vehicles)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Compliant ({compliant})
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div> Expiring 30 Days ({upcoming})
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div> Expired ({expired})
          </div>
        </div>
      </div>
    </div>
  );
}
