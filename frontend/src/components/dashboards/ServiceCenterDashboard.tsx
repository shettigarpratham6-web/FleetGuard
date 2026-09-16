'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { Vehicle, ServiceRecord, MaintenanceRisk } from '@/types';

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color: string;
  bg: string;
}) {
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

export default function ServiceCenterDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [risks, setRisks] = useState<MaintenanceRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected vehicle for details / log service modal
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Form State
  const [serviceType, setServiceType] = useState('Routine Inspection');
  const [cost, setCost] = useState('');
  const [currentMileage, setCurrentMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [v, r, k] = await Promise.all([
        api.vehicles.getAll(),
        api.services.getAll(),
        api.risks.getAll(),
      ]);
      setVehicles(v || []);
      setRecords(r || []);
      setRisks(k || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load service center data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const vehiclesAwaitingService = vehicles.filter(
    (v) => v.status === 'Maintenance'
  );
  const highRiskVehicles = risks.filter((r) => r.risk_level === 'High');
  const overdueVehicles = vehicles.filter((v) => {
    const risk = risks.find((r) => r.vehicle_id === v.id);
    return (risk && risk.remaining_distance <= 0) || v.status === 'Maintenance';
  });

  const handleOpenLogModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setCurrentMileage(v.current_mileage ? String(v.current_mileage) : '');
    setCost('');
    setNotes('');
    setServiceType('Routine Inspection');
    setFormError('');
    setFormSuccess('');
    setShowLogModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    if (!cost || !currentMileage) {
      setFormError('Cost and current mileage are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const user = api.auth.getLocalUser();
      await api.services.create({
        vehicle_id: selectedVehicle.id,
        mechanic_id: user?.id || 'service-center',
        service_date: new Date().toISOString(),
        current_mileage: Number(currentMileage),
        service_type: serviceType,
        description: notes,
        labour_cost: Number(cost) * 0.4,
        parts_cost: Number(cost) * 0.6,
        total_cost: Number(cost),
        next_service_mileage: Number(currentMileage) + 5000,
        next_service_date: new Date(
          Date.now() + 90 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });

      setFormSuccess('Service successfully logged and vehicle risk updated!');
      setTimeout(() => {
        setShowLogModal(false);
        loadData();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save service record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        <p className="font-semibold text-sm text-slate-600">
          Loading Service Center Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 block mb-1">
            Service & Maintenance Hub
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Service Center Dashboard
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
            Manage maintenance queue, log services & update fleet health
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/service-records">
            <button className="bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[18px] text-amber-600">
                description
              </span>
              All Service Records
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

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Awaiting Service"
          value={vehiclesAwaitingService.length}
          sub="In workshop now"
          icon="build_circle"
          color="text-amber-700"
          bg="bg-amber-50 border-amber-200"
        />
        <StatCard
          label="High Risk (Overdue)"
          value={highRiskVehicles.length}
          sub="Predictive risk high"
          icon="warning"
          color="text-rose-700"
          bg="bg-rose-50 border-rose-200"
        />
        <StatCard
          label="Total Services Logged"
          value={records.length}
          sub="Lifetime logs"
          icon="task_alt"
          color="text-emerald-700"
          bg="bg-emerald-50 border-emerald-200"
        />
        <StatCard
          label="Total Serviced Vehicles"
          value={vehicles.length}
          sub="Active fleet count"
          icon="directions_car"
          color="text-blue-700"
          bg="bg-blue-50 border-blue-200"
        />
      </div>

      {/* ── Maintenance Queue / Vehicles Awaiting Service ────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <SectionTitle
            title="Vehicles Awaiting Service & High Risk Queue"
            sub="Click 'Log Service' to complete maintenance & recalculate risk"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Current Mileage</th>
                <th className="px-5 py-3">Risk Level</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.length > 0 ? (
                vehicles.map((v) => {
                  const risk = risks.find((r) => r.vehicle_id === v.id);
                  const isMaintenance = v.status === 'Maintenance';

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-bold text-slate-900">
                        <div className="text-sm">{v.vehicle_number}</div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {v.manufacturer} {v.model} ({v.vehicle_type})
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono font-semibold text-slate-700">
                        {v.current_mileage?.toLocaleString() || 0} mi
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            risk?.risk_level === 'High'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : risk?.risk_level === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {risk?.risk_level || 'Low'} Risk
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isMaintenance
                              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleOpenLogModal(v)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            build
                          </span>
                          Log Service
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    No vehicles found in queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Completed Services ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <SectionTitle
            title="Completed Services History"
            sub="Recent maintenance logs performed by service center"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Service Type</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Mileage</th>
                <th className="px-5 py-3">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length > 0 ? (
                records.slice(0, 8).map((r) => {
                  const v = vehicles.find((v) => v.id === r.vehicle_id);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-900">
                        {v?.vehicle_number || 'Vehicle'}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-700">
                        {r.service_type}
                      </td>
                      <td className="px-5 py-3 text-slate-500 font-mono">
                        {new Date(r.service_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-mono">
                        {r.current_mileage?.toLocaleString()} mi
                      </td>
                      <td className="px-5 py-3 font-mono font-extrabold text-slate-900">
                        ${Number(r.total_cost).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    No completed service records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── LOG SERVICE MODAL ────────────────────────────────────────────────── */}
      {showLogModal && selectedVehicle && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600">
                    build
                  </span>
                  Log Vehicle Service
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vehicle: <strong>{selectedVehicle.vehicle_number}</strong> (
                  {selectedVehicle.manufacturer} {selectedVehicle.model})
                </p>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
                {formSuccess}
              </div>
            )}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  error
                </span>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Service Type *
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="Routine Inspection">Routine Inspection</option>
                  <option value="Oil & Filter Change">Oil & Filter Change</option>
                  <option value="Brake Service">Brake Service</option>
                  <option value="Engine Repair">Engine Repair</option>
                  <option value="Tire Replacement">Tire Replacement</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Current Mileage (mi) *
                  </label>
                  <input
                    type="number"
                    required
                    value={currentMileage}
                    onChange={(e) => setCurrentMileage(e.target.value)}
                    className="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Total Cost ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="250.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Service Notes / Parts Changed
                </label>
                <textarea
                  rows={3}
                  placeholder="Details of servicing..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save & Update Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
