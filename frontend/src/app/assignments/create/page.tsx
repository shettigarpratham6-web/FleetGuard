'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import LayoutWrapper from '@/components/LayoutWrapper';
import { Ban, X, FileText, ArrowRight, User, AlertTriangle, Calendar, Clock, Car, CheckCircle2, ShieldAlert, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);

  // Form States
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

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
        const [v, d, a] = await Promise.all([
          api.vehicles.getAll(),
          api.auth.getUsers('Driver', 'Active'),
          api.assignments?.getAll?.({ status: 'Active' }).catch(() => []) || Promise.resolve([])
        ]);
        setVehicles(v || []);
        setDrivers(d || []);
        setActiveAssignments(a || []);
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
    if (!selectedVehicle || !selectedDriver || !startDate) return;

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
          driver_id: selectedDriver,
          start_date: startDate,
          assignment_date: startDate,
          return_date: returnDate || null,
          notes: assignmentNotes || null
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
      alert(err.message || 'Failed to assign vehicle');
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

      // 2. Retry Assignment with Override Log ID & start_date
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({
          vehicle_id: selectedVehicle,
          driver_id: selectedDriver,
          start_date: startDate,
          assignment_date: startDate,
          return_date: returnDate || null,
          notes: assignmentNotes || null,
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
  const selectedDriverData = drivers.find(d => d.id === selectedDriver);

  const isVehicleNonCompliant = selectedVehicleData && (selectedVehicleData.status === 'Maintenance' || selectedVehicleData.status === 'Inactive' || selectedVehicleData.status === 'EXPIRED');

  // Quick Date Shortcut Handlers
  const setQuickDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    setStartDate(d.toISOString().split('T')[0]);
  };

  const setNextMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
    d.setDate(diff);
    setStartDate(d.toISOString().split('T')[0]);
  };

  // Format backend raw overrideError string into clean bullet points
  const formatDetailedReason = (rawError: string) => {
    if (!rawError) return ['Standard assignment is locked due to compliance constraints.'];
    const parts = rawError.split('. ').filter(Boolean);
    const bullets: string[] = [];

    parts.forEach(p => {
      if (p.includes('is currently')) {
        bullets.push(`🚫 ${p.trim()}`);
      } else if (p.includes('non-compliant')) {
        bullets.push(`📄 Compliance Document Expiry / Violation (${p.replace('Vehicle is non-compliant', '').trim()})`);
      } else if (p.includes('overdue')) {
        bullets.push(`🛠️ Maintenance Overdue (High Risk Status)`);
      } else if (p.includes('override is required')) {
        bullets.push(`🔒 Approved Manager Override Required`);
      } else {
        bullets.push(`⚠️ ${p.trim()}`);
      }
    });

    return bullets.length > 0 ? bullets : [rawError];
  };

  const inputClass = "w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs";
  const labelClass = "block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5";

  return (
    <LayoutWrapper>
      {/* Centered Modal Backdrop Overlay matching Website bg-slate-50 */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
        onClick={() => router.push('/assignments')}
      >
        {/* Centered Dialog Box with Website Card Aesthetics */}
        <div 
          className="bg-white rounded-2xl w-full max-w-[580px] min-w-[320px] max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative my-auto shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 bg-white text-slate-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
                    Fleet Dispatch Control
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">Assign Driver to Vehicle</h2>
              </div>
            </div>
            <button 
              onClick={() => router.push('/assignments')} 
              aria-label="Close modal" 
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content - Scrollable Body with Website Slate-50 Background */}
          <form onSubmit={handleAssign} className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 flex flex-col gap-6 bg-slate-50">
            
            {overrideError && (
              <div className="px-4 py-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{overrideError}</span>
              </div>
            )}

            {/* Section 1: Target Vehicle */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>1. Target Vehicle <span className="text-red-500">*</span></label>
                {selectedVehicleData && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    selectedVehicleData.status === 'Available' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {selectedVehicleData.status}
                  </span>
                )}
              </div>

              <select 
                id="vehicle-select" 
                value={selectedVehicle} 
                onChange={(e) => setSelectedVehicle(e.target.value)} 
                required 
                className={inputClass}
              >
                <option value="">Select a vehicle from fleet...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} — {v.manufacturer} {v.model} ({v.status})
                  </option>
                ))}
              </select>

              {/* Vehicle Live Preview Card */}
              {selectedVehicleData && (
                <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2 text-xs animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Plate Number:</span>
                    <span className="font-mono font-black text-blue-700 text-sm whitespace-nowrap px-2 py-0.5 bg-white rounded border border-blue-200">
                      {selectedVehicleData.vehicle_number}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Make & Model:</span>
                    <span className="font-bold text-slate-900">{selectedVehicleData.manufacturer} {selectedVehicleData.model}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Current Odometer:</span>
                    <span className="font-mono font-extrabold text-slate-800">{selectedVehicleData.current_mileage || 0} km</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Driver Selection */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>2. Select Assigned Driver <span className="text-red-500">*</span></label>
                {selectedDriverData && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Active Driver
                  </span>
                )}
              </div>

              <select 
                id="driver-select" 
                value={selectedDriver} 
                onChange={(e) => setSelectedDriver(e.target.value)} 
                required 
                className={inputClass}
              >
                <option value="">Choose an active driver...</option>
                {drivers.map((d) => {
                  const existingAssign = activeAssignments.find((a: any) => a.driver_id === d.id);
                  const isAlreadyAssigned = !!existingAssign;

                  return (
                    <option key={d.id} value={d.id} disabled={isAlreadyAssigned}>
                      {d.full_name || d.email} {isAlreadyAssigned ? `(Assigned — Vehicle ${existingAssign.vehicle_number})` : `(${d.email})`}
                    </option>
                  );
                })}
              </select>

              {/* Driver Live Preview Card */}
              {selectedDriverData && (
                <div className="mt-3 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2 text-xs animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Driver Name:</span>
                    <span className="font-extrabold text-slate-900">{selectedDriverData.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Email:</span>
                    <span className="font-mono text-slate-700">{selectedDriverData.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Status:</span>
                    <span className="font-extrabold text-emerald-700">Ready for Duty</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Start Date & Schedule */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>3. Assignment Start Date <span className="text-red-500">*</span></label>
                <span className="text-[11px] font-mono font-bold text-blue-600" suppressHydrationWarning>
                  {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Fast Date Shortcut Chips */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className={`flex-1 py-1.5 px-2 text-[11px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                    startDate === new Date().toISOString().split('T')[0]
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="flex-1 py-1.5 px-2 text-[11px] font-extrabold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer"
                >
                  Tomorrow
                </button>

                <button
                  type="button"
                  onClick={setNextMonday}
                  className="flex-1 py-1.5 px-2 text-[11px] font-extrabold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer"
                >
                  Next Mon
                </button>
              </div>
            </div>

            {/* Section 4: Return Date & Shift Notes (Optional) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <label className={labelClass}>Expected Return Date (Optional)</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Shift / Duty Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Log any route notes or duty instructions..."
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
            </div>

            {/* Non-compliant vehicle warning */}
            {isVehicleNonCompliant && (
              <div className="bg-amber-50/80 border border-amber-300 border-l-4 border-l-amber-500 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0" /> 
                  Compliance Flag Intercepted
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  This vehicle has pending document renewals or active maintenance flags. Standard assignment is locked.
                </p>
                <label className="flex items-center gap-2 text-xs font-extrabold text-amber-900 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={modalStage === 'OVERRIDE'}
                    onChange={(e) => setModalStage(e.target.checked ? 'OVERRIDE' : 'NONE')}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  Enable Supervisor Override Protocol
                </label>
              </div>
            )}

            {/* Manager Override Authorization Card with 4 Unique Categories */}
            {modalStage === 'OVERRIDE' ? (
              <div className="bg-gradient-to-br from-amber-50 via-amber-50/90 to-amber-100/50 rounded-2xl p-5 border border-amber-300 shadow-sm space-y-4 text-slate-900">
                <div className="flex items-center gap-3 border-b border-amber-200/80 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-amber-950 uppercase text-xs tracking-wider">Supervisor Dispatch Override</h4>
                    <p className="text-[11px] text-amber-800 font-semibold mt-0.5 font-sans">Authorized Manager Special Clearance Protocol</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-amber-950 uppercase tracking-wider mb-2">
                    Select Override Authorization Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { cat: 'Emergency Shift Coverage', icon: '🚨' },
                      { cat: 'Route Critical Dispatch', icon: '⚡' },
                      { cat: 'Supervisor Special Clearance', icon: '🛡️' },
                      { cat: 'Grace Period Extension', icon: '⌛' }
                    ].map(item => (
                      <button
                        key={item.cat}
                        type="button"
                        onClick={() => setOverrideCategory(item.cat)}
                        className={`p-2.5 rounded-xl border text-[11px] font-extrabold transition-all flex items-center gap-2 text-left cursor-pointer ${
                          overrideCategory === item.cat 
                            ? 'bg-amber-600 text-white border-amber-600 font-black shadow-xs' 
                            : 'bg-white text-slate-800 border-amber-200 hover:border-amber-400 hover:bg-amber-100/40'
                        }`}
                      >
                        <span className="text-xs">{item.icon}</span>
                        <span>{item.cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-black text-amber-950 uppercase tracking-wider">
                      Justification Notes <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-amber-700 font-bold">{overrideReason.length} chars</span>
                  </div>
                  <textarea
                    required
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    className="w-full border border-amber-300 rounded-xl p-3 text-xs font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[90px]"
                    placeholder={overrideCategory ? `[${overrideCategory}] Provide detailed manager reasoning...` : "Select an override category above..."}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-amber-200">
                  <button 
                    type="button" 
                    onClick={() => setModalStage('NONE')} 
                    disabled={submitLoading} 
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleForceAssignment}
                    disabled={submitLoading || !overrideCategory || !overrideReason}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-md disabled:opacity-50 cursor-pointer border-0 flex items-center gap-1.5"
                  >
                    {submitLoading ? 'Authorizing...' : 'Force Assignment'}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 justify-end mt-auto pt-5 border-t border-slate-200 shrink-0">
                <button 
                  type="button" 
                  onClick={() => router.push('/assignments')} 
                  disabled={submitLoading} 
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-extrabold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitLoading || !selectedVehicle || !selectedDriver || !startDate} 
                  className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer border-0 flex items-center gap-2"
                >
                  {submitLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            )}

          </form>
        </div>
      </div>

      {/* Assignment Blocked Modal - Custom Enterprise Intercept Design */}
      {modalStage === 'BLOCKED' && selectedVehicleData && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4" onClick={() => setModalStage('NONE')}>
          <div className="w-full max-w-[540px] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            
            {/* Header - Slate Dark Premium Theme */}
            <div className="flex items-center justify-between px-6 py-4.5 bg-slate-900 text-white relative border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl shrink-0">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Safety & Regulatory Intercept
                  </span>
                  <h2 className="text-lg font-black text-white tracking-tight mt-0.5">Vehicle Deployment Intercepted</h2>
                </div>
              </div>
              <button
                onClick={() => setModalStage('NONE')}
                aria-label="Close modal"
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 flex flex-col gap-4 bg-slate-50">
              
              {/* Vehicle Asset Card */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-blue-700 text-sm px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-lg">
                    {selectedVehicleData.vehicle_number}
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-300">
                    REGULATORY HOLD
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-extrabold">{selectedVehicleData.manufacturer} {selectedVehicleData.model}</p>
                <p className="text-[11px] font-mono text-slate-500">Reg #: {selectedVehicleData.registration_number || 'N/A'}</p>
              </div>

              {/* Status Intercept Box */}
              <div className="p-4 bg-amber-50/80 border border-amber-300 border-l-4 border-l-amber-500 rounded-2xl text-xs text-amber-950 font-medium leading-relaxed">
                <p className="font-black uppercase text-[10px] text-amber-900 tracking-wider mb-1">Dispatch Intercept Active</p>
                Fleet safety protocols have restricted direct assignment for vehicle <strong>{selectedVehicleData.vehicle_number}</strong> due to active document or maintenance flags.
              </div>

              {/* Flagged Constraints Audit */}
              <div>
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Flagged Compliance Audit</h3>
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 leading-relaxed space-y-1.5 shadow-xs">
                  {formatDetailedReason(overrideError).map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-200 mt-1">
                <button 
                  type="button" 
                  onClick={() => setModalStage('NONE')} 
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-extrabold rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Abort Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setModalStage('OVERRIDE')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer border-0"
                >
                  Authorize Supervisor Override
                  <ArrowRight size={15} />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}
