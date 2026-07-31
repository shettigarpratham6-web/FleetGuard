'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import Footer from "@/components/Footer";

interface RiskItem {
  id: string;
  unit: string;
  model: string;
  alert: string;
  risk: 'High' | 'Medium' | 'Low';
  range: string;
  depot: string;
}

const defaultRiskData: RiskItem[] = [
  {
    id: 'mr-h1',
    unit: '#842',
    model: 'Volvo VNL 860',
    alert: 'Transmission fluid pressure dropping rapidly; abnormal gear slip detected.',
    risk: 'High',
    range: '< 15 mi',
    depot: 'Central Depot',
  },
  {
    id: 'mr-h2',
    unit: '#119',
    model: 'Freightliner Cascadia',
    alert: 'Engine vibration (Harmonic balancer) detected 40% above baseline threshold.',
    risk: 'High',
    range: '~ 45 mi',
    depot: 'Northwest Hub',
  },
  {
    id: 'mr-m1',
    unit: '#592',
    model: 'Peterbilt 579',
    alert: 'DPF (Diesel Particulate Filter) pressure differential trending upwards. Regeneration cycle inefficient over last 3 trips.',
    risk: 'Medium',
    range: '~ 850 mi',
    depot: 'Central Depot',
  },
  {
    id: 'mr-m2',
    unit: '#401',
    model: 'Kenworth T680',
    alert: 'Coolant temperature minor fluctuations detected during sustained incline grades. Potential thermostat sticking.',
    risk: 'Medium',
    range: '~ 1,200 mi',
    depot: 'East Coast',
  },
  {
    id: 'mr-l1',
    unit: '#992',
    model: 'Volvo VNL 760',
    alert: 'Brake pad wear sensor indicates ~15% life remaining on steer axle. Schedule replacement next routine PM.',
    risk: 'Low',
    range: '~ 5,000 mi',
    depot: 'Northwest Hub',
  },
  {
    id: 'mr-l2',
    unit: '#105',
    model: 'Freightliner Cascadia',
    alert: 'Battery voltage resting slightly below optimal threshold post-trip. Alternator output normal. Monitor cold starts.',
    risk: 'Low',
    range: 'N/A',
    depot: 'East Coast',
  },
];

export default function PredictiveRiskPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All Risk Levels');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [riskData, setRiskData] = useState<RiskItem[]>(defaultRiskData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const [backendRisks, backendVehicles] = await Promise.all([
          api.risks.getAll(),
          api.vehicles.getAll(),
        ]);
        if (backendRisks && backendRisks.length > 0) {
          const mapped: RiskItem[] = backendRisks.map((r: any) => {
            const v = backendVehicles.find((veh: any) => veh.id === r.vehicle_id);
            return {
              id: r.id,
              unit: v ? `#${v.vehicle_number}` : `#${r.vehicle_id.slice(0, 4)}`,
              model: v ? `${v.manufacturer} ${v.model}` : 'Fleet Asset',
              alert: r.summary || 'Preventive telemetry alert.',
              risk: (r.risk_level as 'High' | 'Medium' | 'Low') || 'Low',
              range: r.remaining_distance ? `~ ${r.remaining_distance.toLocaleString()} mi` : 'N/A',
              depot: v?.branch_id ? `Branch ${v.branch_id.slice(0, 6)}` : 'Central Depot',
            };
          });
          setRiskData(mapped);
        }
      } catch (err: any) {
        console.error('Error loading predictive risks from API:', err);
        setError(err.message || 'Failed to load predictive risks');
      } finally {
        setLoading(false);
      }
    };
    fetchRiskData();
  }, []);

  // Filtering Logic
  const filteredData = riskData.filter((item) => {
    const matchesSearch =
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alert.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk =
      riskFilter === 'All Risk Levels' ||
      item.risk.toLowerCase() === riskFilter.replace(' Risk', '').toLowerCase();

    const matchesBranch = branchFilter === 'All Branches' || item.depot === branchFilter;

    return matchesSearch && matchesRisk && matchesBranch;
  });

  const highRiskInterventions = filteredData.filter((item) => item.risk === 'High');
  const watchlistItems = filteredData.filter((item) => item.risk !== 'High');

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-md bg-[#0f172a] text-white">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body-md text-slate-400 mt-4">Analyzing fleet telemetry...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper
      searchPlaceholder="Search vehicles, alerts..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="min-h-full bg-[#0f172a] text-slate-100 p-lg md:p-margin-desktop space-y-lg">

        {/* Page Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md border-b border-slate-800 pb-md">
          <div>
            <h2 className="font-display-lg text-display-lg text-white flex items-center gap-sm">
              <span className="material-symbols-outlined text-error text-3xl">warning</span>
              Predictive Risk Analysis
            </h2>
            <p className="font-body-lg text-body-lg text-slate-400 mt-xs">
              AI-driven telemetry alerts for proactive fleet intervention.
            </p>
          </div>

          {/* Filtering selectors */}
          <div className="flex flex-wrap gap-sm w-full md:w-auto">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-[#1e293b] border border-slate-700 text-white rounded-lg px-md py-sm focus:border-primary-fixed focus:ring-1 focus:ring-primary-fixed font-body-sm outline-none cursor-pointer"
            >
              <option>All Risk Levels</option>
              <option>High Risk</option>
              <option>Medium Risk</option>
              <option>Low Risk</option>
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-[#1e293b] border border-slate-700 text-white rounded-lg px-md py-sm focus:border-primary-fixed focus:ring-1 focus:ring-primary-fixed font-body-sm outline-none cursor-pointer"
            >
              <option>All Branches</option>
              <option>Central Depot</option>
              <option>Northwest Hub</option>
              <option>East Coast</option>
            </select>

            <button className="bg-[#1e293b] border border-slate-700 text-white rounded-lg p-sm hover:bg-[#334155] transition-colors flex items-center justify-center cursor-pointer">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-md rounded-xl bg-error-container/10 border border-error-container/30 text-error text-body-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">

          {/* Left Block: Critical Alert Summary */}
          <div className="lg:col-span-4 bg-[#1e293b] rounded-xl border border-error/30 p-lg shadow-[0_4px_20px_-5px_rgba(186,26,26,0.2)] relative overflow-hidden flex flex-col justify-between h-72 lg:h-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
            <div>
              <div className="flex items-center gap-sm mb-md text-error">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  error
                </span>
                <span className="font-label-md text-label-md uppercase tracking-wider">
                  Critical Fleet Status
                </span>
              </div>
              <div className="font-display-lg text-display-lg text-white mb-xs">
                {highRiskInterventions.length} Vehicles
              </div>
              <p className="font-body-sm text-body-sm text-slate-400 leading-relaxed">
                Require immediate grounding to prevent catastrophic transmission or engine failure.
              </p>
            </div>
            <div className="mt-lg">
              <button
                className="w-full bg-error text-white font-label-md py-sm rounded-lg hover:bg-error/90 transition-colors cursor-pointer active:opacity-85 shadow-sm"
                onClick={() => alert('Mobile mechanics dispatched to affected locations.')}
              >
                Dispatch Mobile Mechanics
              </button>
            </div>
          </div>

          {/* Right Block: High Risk Priority Table */}
          <div className="lg:col-span-8 bg-[#1e293b] rounded-xl border border-slate-800 shadow-md overflow-hidden flex flex-col min-h-[300px]">
            <div className="px-lg py-md border-b border-slate-800 flex justify-between items-center bg-[#0f172a]/50">
              <h3 className="font-headline-sm text-headline-sm text-white flex items-center gap-sm">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                Priority Intervention Required
              </h3>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-label-md text-label-md uppercase">
                    <th className="px-md py-sm font-semibold">Vehicle</th>
                    <th className="px-md py-sm font-semibold">Telemetry Alert</th>
                    <th className="px-md py-sm font-semibold text-right">Est. Range</th>
                    <th className="px-md py-sm font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm">
                  {highRiskInterventions.length > 0 ? (
                    highRiskInterventions.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-800/50 hover:bg-[#334155]/30 transition-colors"
                      >
                        <td className="px-md py-md">
                          <div className="flex items-center gap-md">
                            <div className="w-10 h-10 rounded bg-[#0f172a] border border-slate-800 flex flex-col items-center justify-center">
                              <span className="font-data-mono text-data-mono text-white">
                                {item.unit}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-white">{item.model}</div>
                              <div className="text-slate-400 text-[10px]">{item.depot}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-md py-md">
                          <div className="flex items-start gap-sm">
                            <span className="bg-error/10 text-error border border-error/30 rounded px-xs py-[2px] text-[10px] font-bold uppercase mt-1 flex-shrink-0">
                              High
                            </span>
                            <span className="text-slate-300">{item.alert}</span>
                          </div>
                        </td>
                        <td className="px-md py-md text-right font-data-mono text-error font-bold whitespace-nowrap">
                          {item.range}
                        </td>
                        <td className="px-md py-md text-center">
                          <button
                            className="text-tertiary-fixed hover:text-white transition-colors cursor-pointer"
                            title="Plan Route"
                            onClick={() => alert(`Optimizing routing for Unit ${item.unit} back to nearest hub.`)}
                          >
                            <span className="material-symbols-outlined">route</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-lg text-center text-slate-400">
                        No critical priority groundings matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Watchlist Section */}
        <div className="space-y-md">
          <h3 className="font-headline-sm text-headline-sm text-white border-b border-slate-800 pb-sm flex justify-between items-end">
            Watchlist
            <span className="font-body-sm text-slate-400 font-normal">Sorted by Severity</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
            {watchlistItems.length > 0 ? (
              watchlistItems.map((item) => {
                const isMedium = item.risk === 'Medium';
                return (
                  <div
                    key={item.id}
                    className="bg-[#1e293b] rounded-xl border border-slate-800 p-md flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-sm">
                      <div className="font-data-mono text-data-mono text-white bg-[#0f172a] px-sm py-xs rounded border border-slate-800">
                        {item.unit}
                      </div>
                      <span
                        className={`border rounded px-sm py-xs text-xs font-bold uppercase ${isMedium
                          ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
                          : 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                          }`}
                      >
                        {item.risk}
                      </span>
                    </div>

                    <h4 className="font-semibold text-white mb-xs truncate">{item.model}</h4>

                    <div className="bg-[#0f172a] rounded p-sm border border-slate-800/50 mb-md flex-1">
                      <p className="font-body-sm text-slate-300 line-clamp-3 leading-relaxed">
                        {item.alert}
                      </p>
                    </div>

                    <div className="flex justify-between items-end border-t border-slate-800/50 pt-sm mt-auto">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                          Est. Safe Range
                        </div>
                        <div className="font-data-mono text-white">{item.range}</div>
                      </div>
                      <button
                        className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center hover:bg-primary-fixed hover:text-primary transition-colors text-white cursor-pointer active:opacity-85"
                        onClick={() => alert(`Showing AI diagnostics telemetry trends for Unit ${item.unit}.`)}
                      >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-lg bg-[#1e293b] rounded-xl border border-slate-800 text-center text-slate-400">
                No watchlist vehicles match the filter criteria.
              </div>
            )}
          </div>
        </div>
        <div><Footer /></div>
      </div>
    </LayoutWrapper>
  );
}
