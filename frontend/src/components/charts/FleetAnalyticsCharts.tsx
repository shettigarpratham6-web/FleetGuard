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
  const activePercentage = total > 0 ? Math.round((compliant / total) * 100) : 100;

  // Monthly service trend (sample data mapped to actual volume)
  const monthlyVolume = [
    { month: 'Jan', val: 42 },
    { month: 'Feb', val: 58 },
    { month: 'Mar', val: 35 },
    { month: 'Apr', val: 78 },
    { month: 'May', val: 52 },
    { month: 'Jun', val: 68 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {/* Monthly Service Activity */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">bar_chart</span>
          Monthly Maintenance Volume & Cost Velocity
        </h3>
        <div className="h-64 w-full flex items-end justify-between gap-3 border-b border-slate-100 pb-2 px-2">
          {monthlyVolume.map((item, i) => (
            <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
              <div 
                className="w-full max-w-[44px] bg-gradient-to-t from-blue-600 via-indigo-500 to-sky-400 hover:from-blue-700 hover:to-indigo-600 rounded-t-xl transition-all duration-300 shadow-md group-hover:shadow-lg cursor-pointer" 
                style={{ height: `${item.val}%` }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl pointer-events-none whitespace-nowrap z-20">
                  {item.val} Services
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
          {monthlyVolume.map((item, i) => (
            <span key={i} className="flex-1 text-center">{item.month}</span>
          ))}
        </div>
      </div>

      {/* Fleet Compliance & Status Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600">pie_chart</span>
          Fleet Health & Compliance Status
        </h3>
        <div className="h-64 flex items-center justify-center">
          <div className="relative w-48 h-48 rounded-full border-[22px] border-emerald-500 border-r-amber-400 border-b-rose-500 border-l-blue-500 flex items-center justify-center shadow-inner">
             <div className="text-center">
               <p className="text-3xl font-black text-slate-900">{activePercentage}%</p>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Compliant</p>
             </div>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Compliant ({metrics?.compliantVehicles || 0})
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div> Upcoming Expiry ({metrics?.upcomingExpiryVehicles || 0})
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div> Expired/Risk ({metrics?.expiredVehicles || 0})
          </div>
        </div>
      </div>
    </div>
  );
}
