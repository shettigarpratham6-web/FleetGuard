'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle } from '@/types';
import Link from 'next/link';

interface DriverAssignment {
  id: string;
  vehicle_id: string;
  driver_id: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  assignment_status?: string;
  notes?: string;
  created_at?: string;
}

export default function DriverMyVehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = api.auth.getLocalUser();
    if (currentUser?.role !== 'Driver') {
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [allVehicles, allAssignments] = await Promise.all([
          api.vehicles.getAll().catch(() => []),
          api.assignments?.getAll?.().catch(() => []) || Promise.resolve([])
        ]);

        const myAssignedList = (allAssignments || []).filter((a: any) => a.driver_id === currentUser.id);
        setAssignments(myAssignedList);
        setVehicles(allVehicles || []);
      } catch (err) {
        console.error('Failed to load driver vehicles data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center h-[65vh] space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Loading Assigned Vehicles History...</p>
        </div>
      </LayoutWrapper>
    );
  }

  // Active Assignment & Historical Assignments
  const activeAssignment = assignments.find(a => a.status === 'Active' || a.assignment_status === 'Active');
  const activeVehicle = activeAssignment 
    ? vehicles.find(v => v.id === activeAssignment.vehicle_id) 
    : (vehicles.length > 0 ? vehicles[0] : null);

  // Group all assigned vehicles (both active and past)
  const assignedVehicleIds = new Set(assignments.map(a => a.vehicle_id));
  const assignedVehiclesList = vehicles.filter(v => assignedVehicleIds.has(v.id));

  // If no assignments exist in DB, fallback to active vehicle if present
  const displayVehiclesList = assignedVehiclesList.length > 0 
    ? assignedVehiclesList 
    : (activeVehicle ? [activeVehicle] : []);

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-extrabold text-[11px] uppercase tracking-wider">
                Driver Portal
              </span>
              <span className="text-xs font-semibold text-slate-400">• Vehicle Assignment Log</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Assigned Vehicles</h1>
            <p className="text-slate-500 text-sm mt-1">
              Complete history of vehicles assigned to you till date, specs & active duty details
            </p>
          </div>

          <Link
            href="/driver"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all self-start md:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">speed</span>
            Go To Driver Console
          </Link>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">directions_car</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Vehicles Assigned</p>
                <p className="text-2xl font-black text-slate-900">{displayVehiclesList.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Duty Vehicle</p>
                <p className="text-lg font-black text-emerald-700 font-mono whitespace-nowrap">
                  {activeVehicle ? activeVehicle.vehicle_number : 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">speed</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Odometer</p>
                <p className="text-2xl font-black text-slate-900 whitespace-nowrap">
                  {activeVehicle ? `${activeVehicle.current_mileage || 0} km` : '0 km'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Currently Active Vehicle Hero Section */}
        {activeVehicle && (
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-xl overflow-hidden border border-blue-900/50 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[11px] font-black uppercase tracking-wider">
                    CURRENTLY ON DUTY
                  </span>
                  <span className="text-xs font-mono text-slate-300 whitespace-nowrap">VIN: {activeVehicle.vin || 'N/A'}</span>
                </div>

                <h2 className="text-3xl font-black tracking-tight text-white">
                  {activeVehicle.manufacturer} {activeVehicle.model}
                </h2>
                
                {/* License Plate & Year in One Line */}
                <div className="flex flex-wrap items-center gap-x-3 text-slate-200 text-sm font-medium">
                  <span className="whitespace-nowrap">
                    License Plate: <strong className="font-mono font-black text-white text-base tracking-wider whitespace-nowrap px-1.5 py-0.5 bg-white/10 rounded">{activeVehicle.vehicle_number}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="whitespace-nowrap">
                    Year: <strong className="font-extrabold text-white">{activeVehicle.manufacturing_year || '2023'}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
                    <p className="text-[10px] uppercase font-bold text-slate-300">Registration</p>
                    <p className="text-xs font-mono font-bold text-white whitespace-nowrap">{activeVehicle.registration_number || 'N/A'}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
                    <p className="text-[10px] uppercase font-bold text-slate-300">Status</p>
                    <p className="text-xs font-bold text-emerald-300 whitespace-nowrap">{activeVehicle.status}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
                    <p className="text-[10px] uppercase font-bold text-slate-300">Odometer</p>
                    <p className="text-xs font-mono font-bold text-white whitespace-nowrap">{activeVehicle.current_mileage || 0} km</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 shrink-0">
                <Link
                  href="/driver"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                  Perform Pre-Trip Checklist
                </Link>
                <button
                  onClick={() => setSelectedVehicle(activeVehicle)}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition-all text-center cursor-pointer"
                >
                  View Full Specifications
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vehicles Assigned Till Date Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Vehicle Assignment Log (Till Date)</h3>
              <p className="text-xs text-slate-500">Record of all fleet vehicles assigned to your driver account</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-full border border-slate-200 whitespace-nowrap">
              {displayVehiclesList.length} Vehicles Recorded
            </span>
          </div>

          {displayVehiclesList.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">directions_car</span>
              <p className="text-sm font-semibold">No vehicle assignments found in history.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                    <th className="p-3.5">Vehicle / License Plate</th>
                    <th className="p-3.5">Make & Model</th>
                    <th className="p-3.5">Registration #</th>
                    <th className="p-3.5">Assignment Period</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Odometer Reading</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayVehiclesList.map((v) => {
                    const assignRecord = assignments.find(a => a.vehicle_id === v.id);
                    const isActive = activeVehicle?.id === v.id;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                              <span className="material-symbols-outlined text-[18px]">directions_car</span>
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 font-mono text-xs whitespace-nowrap">{v.vehicle_number}</p>
                              <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">ID: {v.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-extrabold text-slate-800 whitespace-nowrap">
                          {v.manufacturer} {v.model}
                        </td>

                        <td className="p-3.5 font-mono text-slate-700 font-semibold whitespace-nowrap">
                          {v.registration_number || 'N/A'}
                        </td>

                        <td className="p-3.5 font-medium text-slate-600 whitespace-nowrap">
                          {assignRecord?.start_date ? (
                            <span>
                              {new Date(assignRecord.start_date).toLocaleDateString()} – {assignRecord.end_date ? new Date(assignRecord.end_date).toLocaleDateString() : 'Present'}
                            </span>
                          ) : (
                            <span className="text-slate-400">Assigned Duty</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {isActive ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                              Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-300 whitespace-nowrap">
                              Completed
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {v.current_mileage || 0} km
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedVehicle(v)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Vehicle Detail Modal */}
        {selectedVehicle && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fadeIn"
            onClick={() => setSelectedVehicle(null)}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-[480px] min-w-[320px] shrink-0 p-6 space-y-5 shadow-2xl border border-slate-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-blue-600">directions_car</span>
                  <h3 className="text-lg font-extrabold text-slate-900">Vehicle Details</h3>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Plate Number:</span>
                    <span className="font-extrabold font-mono text-blue-700 text-sm whitespace-nowrap">{selectedVehicle.vehicle_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Make & Model:</span>
                    <span className="font-bold text-slate-900">{selectedVehicle.manufacturer} {selectedVehicle.model}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Registration #:</span>
                    <span className="font-mono text-slate-800 whitespace-nowrap">{selectedVehicle.registration_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Manufacturing Year:</span>
                    <span className="text-slate-800">{selectedVehicle.manufacturing_year || '2023'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Current Odometer:</span>
                    <span className="font-mono font-bold text-slate-900 whitespace-nowrap">{selectedVehicle.current_mileage || 0} km</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </LayoutWrapper>
  );
}
