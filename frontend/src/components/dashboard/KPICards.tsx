'use client';

import React from 'react';
import Link from 'next/link';
import { Vehicle, MaintenanceRisk } from '@/types';

interface KPICardsProps {
  vehicles: Vehicle[];
  risks: MaintenanceRisk[];
  loading?: boolean;
}

export default function KPICards({ vehicles, risks, loading = false }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm animate-pulse h-32 flex flex-col justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-8 bg-slate-200 rounded w-1/3 mt-2"></div>
          </div>
        ))}
      </div>
    );
  }

  const totalRisks = risks.length || 1;
  const highRiskCount = risks.filter((r) => r.risk_level === 'High').length;
  const mediumRiskCount = risks.filter((r) => r.risk_level === 'Medium').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Vehicles */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Total Fleet Assets</p>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{vehicles.length}</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px]">arrow_upward</span> Live
          </span>
        </div>
      </div>

      {/* Due for Service */}
      <Link href="/maintenance-queue" className="block group">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Due for Service</p>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <span className="material-symbols-outlined text-[18px]">build</span>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                {mediumRiskCount + highRiskCount}
              </span>
              <span className="text-xs font-medium text-slate-500">vehicles</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round(((mediumRiskCount + highRiskCount) / (totalRisks || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </Link>

      {/* Overdue Tasks */}
      <Link href="/maintenance-queue" className="block group">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Overdue Tasks</p>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {highRiskCount}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Attention Needed</span>
          </div>
        </div>
      </Link>

      {/* High Risk Alert */}
      <Link href="/predictive-risk" className="block group">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">High Risk Alert</p>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center animate-bounce">
              <span className="material-symbols-outlined text-[18px]">report</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-rose-600 tracking-tight">
              {highRiskCount}
            </span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              Immediate Action
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
