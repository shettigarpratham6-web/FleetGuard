import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Wrench } from 'lucide-react';

export default function ServiceQueueTable({ filteredVehicles, assignments, users, recentlyServiced = [], handleStartService, handleOpenPopup, handleOpenHistoricalPopup }: any) {
  const router = useRouter();
  
  // Sort queue: Maintenance status first, then High Risk, then normal
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (a.status === 'Maintenance' && b.status !== 'Maintenance') return -1;
    if (b.status === 'Maintenance' && a.status !== 'Maintenance') return 1;
    if (a.maintenance_risk === 'High' && b.maintenance_risk !== 'High') return -1;
    if (b.maintenance_risk === 'High' && a.maintenance_risk !== 'High') return 1;
    return 0;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Service Center Maintenance Queue</h3>
          <p className="text-xs text-slate-500 mt-0.5">Prioritized queue of vehicles requiring servicing or inspection renewal.</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-600">
          {sortedVehicles.length} Vehicles in Queue
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-3.5">Vehicle & Model</th>
              <th className="px-6 py-3.5">Odometer Reading</th>
              <th className="px-6 py-3.5">Priority / Queue Status</th>
              <th className="px-6 py-3.5">Target Due Condition</th>
              <th className="px-6 py-3.5 text-right">Single-Action Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedVehicles.map((vehicle: any) => {
              const assignment = assignments.find((a: any) => a.vehicle_id === vehicle.id && a.status === 'Active');
              const driver = users.find((u: any) => u.id === assignment?.driver_id);
              const isRecentlyServiced = recentlyServiced.includes(vehicle.id);
              const isHighRisk = vehicle.maintenance_risk === 'High';
              const isInMaintenance = vehicle.status === 'Maintenance';

              return (
                <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{vehicle.vehicle_number}</div>
                    <div className="text-xs font-medium text-slate-500">{vehicle.make} {vehicle.model || ''}</div>
                    {driver && (
                      <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Driver: {driver.full_name}</div>
                    )}
                  </td>

                  <td className="px-6 py-4 font-mono font-bold text-slate-800">
                    {vehicle.current_mileage?.toLocaleString() || 0} km
                  </td>

                  <td className="px-6 py-4">
                    {isRecentlyServiced ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" /> Recently Serviced (Clocks Reset)
                      </span>
                    ) : isInMaintenance ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                        <Wrench size={12} /> In Shop / Work in Progress
                      </span>
                    ) : isHighRisk ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-2 h-2 rounded-full bg-rose-600"></span> High Risk / Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Scheduled Inspection
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs font-medium text-slate-600">
                    <div>Recommended: <span className="font-bold text-slate-800">Every 10,000 km</span></div>
                    <div className="text-[11px] text-slate-500">Auto-resets risk & compliance clock</div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    {isRecentlyServiced ? (
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm animate-fade-in">
                        <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                        Recently Serviced
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartService(vehicle.id)}
                          disabled={isInMaintenance}
                          className={`px-3 py-2 text-[11px] font-extrabold rounded-lg transition-colors border ${
                            isInMaintenance 
                              ? 'bg-amber-100 text-amber-800 border-amber-300 cursor-not-allowed'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                          }`}
                        >
                          {isInMaintenance ? 'In Shop' : 'Start Job'}
                        </button>
                        
                        <button
                          onClick={() => handleOpenPopup(vehicle)}
                          title="Completing a service record automatically updates mileage, resets risk score, and extends compliance expiry clocks."
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-sm"
                        >
                          <CheckCircle size={14} />
                          Complete & Reset Clocks
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {sortedVehicles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No vehicles found in the maintenance queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
