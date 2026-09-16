'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { Vehicle, User } from '@/types';

// ── Helpers ─────────────────────────────────────────────────────────────────
const daysUntil = (dateStr: string) =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);

// ── Sub-components ──────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, color, bg,
}: { label: string; value: string | number; sub?: string; icon: string; color: string; bg: string }) {
  return (
    <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>{label}</p>
        <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
          <span className={`material-symbols-outlined text-[18px] ${color}`}>{icon}</span>
        </div>
      </div>
      <div className={`text-3xl font-extrabold tracking-tight ${color}`}>{value}</div>
      {sub && <p className="text-[11px] font-medium text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Override Modal ──────────────────────────────────────────────────────────
interface OverrideModalProps {
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function OverrideModal({ vehicleId, vehicleNumber, driverId, onClose, onSuccess }: OverrideModalProps) {
  const [reason, setReason] = useState('');
  const [managerName, setManagerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !managerName.trim()) {
      setError('Both fields are required.');
      return;
    }
    setSaving(true);
    try {
      await api.assignments.create({
        vehicle_id: vehicleId,
        driver_id: driverId,
        override_reason: `[AUTHORIZED OVERRIDE by ${managerName}] ${reason} — ${new Date().toLocaleString()}`,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Override failed. Check backend logs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-amber-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-amber-600">admin_panel_settings</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Authorized Assignment Override</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Vehicle <strong>{vehicleNumber}</strong> has expired compliance. Provide override details.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          This override will be logged with your name and timestamp.
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Manager Name *</label>
            <input
              type="text"
              required
              placeholder="Your full name"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Override Reason *</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Emergency delivery approved by ops director."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
              ) : (
                <><span className="material-symbols-outlined text-[15px]">check_circle</span>Confirm Override</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function FleetManagerDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Assignment module state
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [blockedVehicle, setBlockedVehicle] = useState<Vehicle | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [v, c, u, a] = await Promise.all([
        api.vehicles.getAll(),
        api.compliance.getAll(),
        api.auth.getUsers(),
        api.assignments.getAll(),
      ]);
      setVehicles(v || []);
      setComplianceDocs(c || []);
      setDrivers((u || []).filter((user: User) => user.role === 'Driver'));
      setAssignments(a || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load fleet manager data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Computed ───────────────────────────────────────────────────────────────
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const assignedVehicles = vehicles.filter(v => v.status === 'Assigned').length;
  const inServiceVehicles = vehicles.filter(v => v.status === 'Maintenance').length;

  const getVehicleComplianceStatus = (vehicleId: string) => {
    const docs = complianceDocs.filter(d => d.vehicle_id === vehicleId);
    if (!docs.length) return 'unknown';
    const expired = docs.some(d => d.expiry_date && daysUntil(d.expiry_date) < 0);
    if (expired) return 'expired';
    const warning = docs.some(d => d.expiry_date && daysUntil(d.expiry_date) <= 30);
    return warning ? 'warning' : 'valid';
  };

  // Due for inspection/insurance/puc
  const dueForInspection = vehicles.filter(v => {
    const docs = complianceDocs.filter(d => d.vehicle_id === v.id && d.document_type === 'Inspection');
    return docs.some(d => d.expiry_date && daysUntil(d.expiry_date) <= 30 && daysUntil(d.expiry_date) >= 0);
  }).length;

  const dueForInsurance = vehicles.filter(v => {
    const docs = complianceDocs.filter(d => d.vehicle_id === v.id && d.document_type === 'Insurance');
    return docs.some(d => d.expiry_date && daysUntil(d.expiry_date) <= 30 && daysUntil(d.expiry_date) >= 0);
  }).length;

  const dueForPUC = vehicles.filter(v => {
    const docs = complianceDocs.filter(d => d.vehicle_id === v.id && d.document_type === 'PUC');
    return docs.some(d => d.expiry_date && daysUntil(d.expiry_date) <= 30 && daysUntil(d.expiry_date) >= 0);
  }).length;

  // ── Assignment Logic ────────────────────────────────────────────────────────
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');
    if (!selectedVehicle || !selectedDriver) {
      setAssignError('Please select both a vehicle and a driver.');
      return;
    }
    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    if (!vehicle) return;

    const compStatus = getVehicleComplianceStatus(selectedVehicle);
    if (compStatus === 'expired') {
      setBlockedVehicle(vehicle);
      return;
    }
    setAssigning(true);
    try {
      await api.assignments.create({ vehicle_id: selectedVehicle, driver_id: selectedDriver });
      setAssignSuccess('Driver assigned successfully!');
      setSelectedVehicle('');
      setSelectedDriver('');
      load();
    } catch (err: any) {
      setAssignError(err.message || 'Assignment failed.');
    } finally {
      setAssigning(false);
    }
  };

  const handleOverrideSuccess = () => {
    setShowOverrideModal(false);
    setBlockedVehicle(null);
    setAssignSuccess('Override assignment logged and saved!');
    setSelectedVehicle('');
    setSelectedDriver('');
    load();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="font-semibold text-sm text-slate-600">Loading Fleet Manager Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-1">Fleet Management</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Fleet Manager Dashboard</h2>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
            Manage vehicles, compliance, and driver assignments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/vehicles/create">
            <button className="bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[18px] text-blue-600">add_circle</span>
              Register Vehicle
            </button>
          </Link>
          <Link href="/compliance">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Upload Compliance Doc
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {error}
        </div>
      )}

      {/* ── Fleet Summary KPIs ───────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Fleet Summary</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Vehicles" value={totalVehicles} sub="All registered" icon="local_shipping" color="text-slate-700" bg="bg-white border-slate-200" />
          <StatCard label="Available" value={availableVehicles} sub="Ready to assign" icon="directions_car" color="text-blue-700" bg="bg-blue-50 border-blue-200" />
          <StatCard label="Assigned" value={assignedVehicles} sub="On active duty" icon="badge" color="text-emerald-700" bg="bg-emerald-50 border-emerald-200" />
          <StatCard label="In Service" value={inServiceVehicles} sub="Under maintenance" icon="build" color="text-amber-700" bg="bg-amber-50 border-amber-200" />
        </div>
      </div>

      {/* ── Compliance Alerts ────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Compliance Alerts — Due Within 30 Days</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Inspection Due', count: dueForInspection, icon: 'verified', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
            { label: 'Insurance Renewal', count: dueForInsurance, icon: 'shield', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
            { label: 'Pollution (PUC)', count: dueForPUC, icon: 'eco', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
          ].map(item => (
            <div key={item.label} className={`p-4 rounded-2xl border flex items-center gap-4 ${item.bg}`}>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
              </div>
              <div>
                <p className={`text-2xl font-extrabold ${item.color}`}>{item.count}</p>
                <p className="text-xs font-semibold text-slate-600">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Vehicle Registry + Compliance Per Vehicle ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <SectionTitle title="Vehicle Registry & Compliance Status" sub="Live compliance per vehicle" />
          <Link href="/vehicles" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            Manage All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Insurance</th>
                <th className="px-5 py-3">Inspection</th>
                <th className="px-5 py-3">PUC</th>
                <th className="px-5 py-3">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.length > 0 ? vehicles.slice(0, 10).map(v => {
                const docs = complianceDocs.filter(d => d.vehicle_id === v.id);
                const insurance = docs.find(d => d.document_type === 'Insurance');
                const inspection = docs.find(d => d.document_type === 'Inspection');
                const puc = docs.find(d => d.document_type === 'PUC');
                const compStatus = getVehicleComplianceStatus(v.id);

                const docCell = (doc: any) => {
                  if (!doc) return <span className="text-slate-300 font-medium">N/A</span>;
                  const days = daysUntil(doc.expiry_date);
                  const cls = days < 0 ? 'text-rose-600 font-bold' : days <= 7 ? 'text-rose-500 font-bold' : days <= 30 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-medium';
                  return <span className={cls}>{days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}</span>;
                };

                const statusLabel: Record<string, string> = {
                  valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  warning: 'bg-amber-50 text-amber-700 border-amber-200',
                  expired: 'bg-rose-50 text-rose-700 border-rose-200',
                  unknown: 'bg-slate-50 text-slate-500 border-slate-200',
                };

                return (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-900">
                      <div className="text-sm">{v.vehicle_number}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{v.manufacturer} {v.model}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{v.vehicle_type}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        v.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        v.status === 'Assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        v.status === 'Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>{v.status}</span>
                    </td>
                    <td className="px-5 py-3">{docCell(insurance)}</td>
                    <td className="px-5 py-3">{docCell(inspection)}</td>
                    <td className="px-5 py-3">{docCell(puc)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusLabel[compStatus]}`}>
                        {compStatus.charAt(0).toUpperCase() + compStatus.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    <span className="material-symbols-outlined text-[40px] block mb-2">directions_car</span>
                    No vehicles registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Driver Assignment Module ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <SectionTitle title="Driver Assignment Module" sub="Assign drivers to available vehicles. Expired compliance will block assignment." />

        {assignSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>{assignSuccess}
          </div>
        )}
        {assignError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>{assignError}
          </div>
        )}

        {/* Compliance Block Banner */}
        {blockedVehicle && !showOverrideModal && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-rose-600">block</span>
              </div>
              <div>
                <p className="text-sm font-bold text-rose-800">Vehicle Cannot Be Assigned</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  <strong>{blockedVehicle.vehicle_number}</strong> has expired compliance documents.
                  Assignment is blocked pending renewal.
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setBlockedVehicle(null)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowOverrideModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
                Override Assignment
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Select Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={e => setSelectedVehicle(e.target.value)}
              className="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.filter(v => v.status === 'Available').map(v => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} — {v.manufacturer} {v.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Select Driver</label>
            <select
              value={selectedDriver}
              onChange={e => setSelectedDriver(e.target.value)}
              className="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="">-- Choose Driver --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={assigning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 h-[42px]"
          >
            {assigning ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Assigning...</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">person_add</span>Assign Driver</>
            )}
          </button>
        </form>
      </div>

      {/* ── Recent Assignments ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <SectionTitle title="Active Assignments" sub={`${assignments.filter(a => a.status === 'Active').length} drivers currently assigned`} />
          <Link href="/assignment" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Driver</th>
                <th className="px-5 py-3">Assigned On</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.filter(a => a.status === 'Active').slice(0, 6).length > 0 ? (
                assignments.filter(a => a.status === 'Active').slice(0, 6).map(a => {
                  const vehicle = vehicles.find(v => v.id === a.vehicle_id);
                  const driver = drivers.find(d => d.id === a.driver_id);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-900">{vehicle?.vehicle_number || 'Unknown'}</td>
                      <td className="px-5 py-3 text-slate-700">{driver?.full_name || a.driver_id}</td>
                      <td className="px-5 py-3 text-slate-500">{new Date(a.start_date || a.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">Active</span>
                      </td>
                      <td className="px-5 py-3">
                        {a.override_reason ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">Override Used</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    <span className="material-symbols-outlined text-[40px] block mb-2">badge</span>
                    No active assignments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && blockedVehicle && (
        <OverrideModal
          vehicleId={blockedVehicle.id}
          vehicleNumber={blockedVehicle.vehicle_number}
          driverId={selectedDriver}
          onClose={() => setShowOverrideModal(false)}
          onSuccess={handleOverrideSuccess}
        />
      )}
    </div>
  );
}
