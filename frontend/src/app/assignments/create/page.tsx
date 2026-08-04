'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Ban, X, FileText, ArrowRight, User, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Modal Flow States
  const [modalStage, setModalStage] = useState<'NONE' | 'BLOCKED' | 'OVERRIDE'>('NONE');
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [v, d] = await Promise.all([
          api.vehicles.getAll(),
          api.auth.getUsers('Driver', 'Active')
        ]);
        setVehicles(v || []);
        setDrivers(d || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriver) return;

    setSubmitLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({
          vehicle_id: selectedVehicle,
          driver_id: selectedDriver
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.includes('override is required')) {
          setOverrideError(data.error);
          setModalStage('BLOCKED');
          return;
        }
        alert(data.error || 'Failed to assign vehicle');
        return;
      }

      router.push('/assignments');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };



  const handleForceAssignment = async () => {
    if (!overrideReason.trim() || !overrideCategory) return;
    setSubmitLoading(true);
    try {
      // 1. Create Override Log
      const overrideRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/override-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({
          vehicle_id: selectedVehicle,
          driver_id: selectedDriver,
          reason: `[${overrideCategory}] ${overrideReason}`
        })
      });

      const overrideData = await overrideRes.json();
      if (!overrideRes.ok) throw new Error(overrideData.error || 'Failed to create override log');

      // 2. Retry Assignment with Override Log ID
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({
          vehicle_id: selectedVehicle,
          driver_id: selectedDriver,
          override_used: true,
          override_log_id: overrideData.overrideLog.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to force assignment');

      router.push('/assignments');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  const isVehicleNonCompliant = selectedVehicleData && (selectedVehicleData.status === 'Maintenance' || selectedVehicleData.status === 'Inactive' || selectedVehicleData.status === 'EXPIRED');

  const inputClass = "w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5";

  return (
    <>
      <div className="w-full h-full bg-slate-50"></div>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => router.push('/assignments')}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Assign Driver</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedVehicleData
                ? `${selectedVehicleData.manufacturer} ${selectedVehicleData.model} (${selectedVehicleData.vehicle_number})`
                : 'Select vehicle and driver'}
            </p>
          </div>
          <button onClick={() => router.push('/assignments')} aria-label="Close drawer" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors border-0 bg-transparent cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleAssign} className="flex-1 px-6 py-5 flex flex-col gap-5">
          {overrideError && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded-lg">{overrideError}</div>}

          {/* Vehicle selection */}
          <div>
            <label className={labelClass}>Target Vehicle</label>
            <select id="vehicle-select" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} required className={inputClass}>
              <option value="">Select a vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.vehicle_number} — {v.model} ({v.status})</option>
              ))}
            </select>
          </div>

          {/* Driver selection */}
          <div>
            <label className={labelClass}>Select Driver</label>
            <select id="driver-select" value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} required className={inputClass}>
              <option value="">Choose a driver...</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name || d.email} ({d.email})</option>
              ))}
            </select>
          </div>

          {/* Non-compliant warning */}
          {isVehicleNonCompliant && (
            <div className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-sm font-bold text-amber-800 mb-1.5">
                <AlertTriangle size={16} className="text-amber-600" /> Non-Compliant Vehicle Detected
              </div>
              <p className="text-xs text-amber-700 mb-3">This vehicle has expired compliance documents or is currently under maintenance. Standard assignment is locked.</p>
              <label className="flex items-center gap-2 text-xs font-bold text-amber-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalStage === 'OVERRIDE'}
                  onChange={(e) => setModalStage(e.target.checked ? 'OVERRIDE' : 'NONE')}
                />
                Enable Manager Override
              </label>
            </div>
          )}

          {/* Override or action row */}
          {modalStage === 'OVERRIDE' ? (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-2 text-amber-800">
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                <h4 className="font-extrabold uppercase text-[11px] tracking-wider">Manager Override Authorization</h4>
              </div>
              <p className="text-xs text-amber-700">Explicit reasoning is required to force driver assignment on non-compliant vehicles.</p>

              <div>
                <label className="block text-[11px] font-extrabold text-amber-900 uppercase tracking-wider mb-2">Select Override Reason Category</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {['Emergency Shift Coverage', 'Temporary Grace Period', 'Executive Authorization', 'Route Critical Dispatch'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setOverrideCategory(cat)}
                      className={`p-3 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-colors text-left cursor-pointer ${overrideCategory === cat ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">Justification Notes <span className="text-red-500">*</span></label>
                  <span className="text-[10px] font-bold text-slate-400">{overrideReason.length} chars</span>
                </div>
                <textarea
                  required
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  className="w-full border border-amber-300 rounded-lg p-3 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px] transition-colors"
                  placeholder={overrideCategory ? `[${overrideCategory}] Provide detailed reasoning...` : "Select a category first..."}
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end mt-auto pt-4 border-t border-slate-100">
                <button type="button" onClick={() => router.push('/assignments')} disabled={submitLoading} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={handleForceAssignment}
                  disabled={submitLoading || !overrideCategory || !overrideReason}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer border-0"
                >
                  {submitLoading ? 'Processing...' : 'Force Assignment'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 justify-end mt-auto pt-4 border-t border-slate-100">
              <button type="button" onClick={() => router.push('/assignments')} disabled={submitLoading} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer border-0">Cancel</button>
              <button type="submit" disabled={submitLoading || !selectedVehicle || !selectedDriver} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer border-0">
                {submitLoading ? 'Processing...' : 'Assign Driver'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Modal Stage 1: BLOCKED (Error Popup) */}
      {modalStage === 'BLOCKED' && selectedVehicleData && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setModalStage('NONE')}>
          <div className="w-full max-w-[520px] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 bg-red-50 border-b border-red-200 relative">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full shrink-0">
                <Ban size={22} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-red-900">Assignment Blocked</h2>
                <p className="text-xs text-red-600">Vehicle Compliance Violation Intercepted</p>
              </div>
              <button
                onClick={() => setModalStage('NONE')}
                aria-label="Close modal"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-700 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Vehicle summary */}
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-extrabold text-slate-900">{selectedVehicleData.vehicle_number}</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-extrabold uppercase rounded-full border border-red-200">
                    {selectedVehicleData.status === 'Available' ? 'COMPLIANCE VIOLATION' : (selectedVehicleData.status || 'EXPIRED')}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{selectedVehicleData.manufacturer} {selectedVehicleData.model} · VIN: {selectedVehicleData.registration_number}</p>
              </div>

              {/* Warning */}
              <div className="px-4 py-3 bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-xl text-sm text-red-800">
                Standard driver assignment is <strong>blocked</strong> because this vehicle has unresolved compliance issues or is under maintenance.
              </div>

              {/* Expired documents */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">Detailed Reason</h3>
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-medium leading-relaxed">
                  {overrideError}
                </p>
              </div>

              {/* Override notice */}
              <p className="text-xs text-slate-600 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-4 py-3">
                To proceed, a Fleet Manager must authorize a <strong>Manager Override</strong> and enter a valid business justification log.
              </p>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setModalStage('NONE')} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-all cursor-pointer border-0">
                  Cancel Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setModalStage('OVERRIDE')}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all border-0 cursor-pointer"
                >
                  Proceed with Manager Override
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
