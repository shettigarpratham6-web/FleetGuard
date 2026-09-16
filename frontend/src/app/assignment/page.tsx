'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Assignment, Vehicle, User } from '@/types';
import Footer from '@/components/footer';

export default function AssignmentPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Assign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Override Detail Modal State
  const [selectedOverrideReason, setSelectedOverrideReason] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    vehicle_id: '',
    driver_id: '',
    override_reason: '',
  });

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [assignmentsData, vehiclesData, usersData] = await Promise.all([
          api.assignments.getAll(),
          api.vehicles.getAll(),
          api.auth.getUsers('Driver'),
        ]);
        setAssignments(assignmentsData || []);
        setVehicles(vehiclesData || []);
        setDrivers(usersData || []);
      } catch (err: any) {
        console.error('Error loading assignments data:', err);
        setError(err.message || 'Failed to load vehicle assignment data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess('');
    setError('');

    if (!form.vehicle_id || !form.driver_id) {
      setError('Please select both a vehicle and a driver.');
      return;
    }

    try {
      setSubmitting(true);
      const newAssignment = await api.assignments.create({
        vehicle_id: form.vehicle_id,
        driver_id: form.driver_id,
        override_reason: form.override_reason || undefined,
      });

      setAssignments((prev) => [newAssignment, ...prev]);
      setSubmitSuccess('Vehicle assigned to driver successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess('');
        setForm({ vehicle_id: '', driver_id: '', override_reason: '' });
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create vehicle assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnVehicle = async (id: string) => {
    try {
      await api.assignments.returnVehicle(id);
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Completed' } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to return vehicle');
    }
  };

  const handleCancelAssignment = async (id: string) => {
    try {
      await api.assignments.cancelAssignment(id);
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to cancel assignment');
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const v = vehicles.find((veh) => veh.id === a.vehicle_id);
    const d = drivers.find((drv) => drv.id === a.driver_id);
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      v?.vehicle_number.toLowerCase().includes(query) ||
      v?.model.toLowerCase().includes(query) ||
      d?.full_name.toLowerCase().includes(query) ||
      a.status.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = assignments.filter((a) => a.status === 'Active').length;
  const overrideCount = assignments.filter((a) => a.override_reason).length;

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-semibold text-sm text-slate-600">Loading Driver Assignments...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper
      searchPlaceholder="Search assignment by vehicle, driver, or status..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1 block">
              Fleet Operations
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Driver Assignments & Overrides
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Manage active vehicle-to-driver dispatches and authorization override logs
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Assign Vehicle
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Assignments</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{assignments.length}</div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Historic & Active</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase">Active Dispatches</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{activeCount}</div>
            <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Vehicles on road</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-amber-600 uppercase">Authorized Overrides</span>
            <div className="text-3xl font-black text-amber-600 mt-1">{overrideCount}</div>
            <span className="text-[11px] font-semibold text-amber-600 mt-1 block">Logged justification</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase">Driver Roster</span>
            <div className="text-3xl font-black text-blue-600 mt-1">{drivers.length}</div>
            <span className="text-[11px] font-semibold text-blue-600 mt-1 block">Registered drivers</span>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900">Assignment Roster</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Status Filter:</span>
              {['All', 'Active', 'Completed', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Vehicle Asset</th>
                  <th className="p-4">Assigned Driver</th>
                  <th className="p-4">Dispatch Date</th>
                  <th className="p-4">Override Status</th>
                  <th className="p-4">Assignment Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((a) => {
                    const vehicle = vehicles.find((v) => v.id === a.vehicle_id);
                    const driver = drivers.find((d) => d.id === a.driver_id);

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                            </div>
                            <div>
                              <p className="font-mono text-xs font-bold text-slate-900">
                                {vehicle ? vehicle.vehicle_number : 'Vehicle #' + a.vehicle_id.slice(0, 5)}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium">{vehicle ? vehicle.model : ''}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                            <span className="font-bold text-slate-800">{driver ? driver.full_name : 'Driver ID: ' + a.driver_id.slice(0, 5)}</span>
                          </div>
                        </td>

                        <td className="p-4 text-xs font-semibold text-slate-500">
                          {new Date(a.start_date || a.created_at || Date.now()).toLocaleDateString()}
                        </td>

                        <td className="p-4">
                          {a.override_reason ? (
                            <button
                              onClick={() => setSelectedOverrideReason(a.override_reason || '')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">shield</span>
                              Override Logged
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">Standard</span>
                          )}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                              a.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : a.status === 'Completed'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {a.status}
                          </span>
                        </td>

                        <td className="p-4 pr-6 text-right">
                          {a.status === 'Active' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleReturnVehicle(a.id)}
                                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Return Asset
                              </button>
                              <button
                                onClick={() => handleCancelAssignment(a.id)}
                                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs font-medium text-slate-500">
                      No assignment records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: CREATE ASSIGNMENT */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">person_add</span>
                  <h3 className="text-lg font-bold text-slate-900">Assign Vehicle to Driver</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {submitSuccess}
                </div>
              )}

              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Select Vehicle *</label>
                  <select
                    value={form.vehicle_id}
                    onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} ({v.manufacturer} {v.model}) [{v.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Select Driver *</label>
                  <select
                    value={form.driver_id}
                    onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Override Justification (Required if overriding restriction)
                  </label>
                  <textarea
                    rows={3}
                    value={form.override_reason}
                    onChange={(e) => setForm({ ...form, override_reason: e.target.value })}
                    placeholder="Enter reason for assignment override if vehicle status is restricted..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: VIEW OVERRIDE REASON */}
        {selectedOverrideReason && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600">shield</span>
                  <h3 className="text-lg font-bold text-slate-900">Override Authorization Audit</h3>
                </div>
                <button onClick={() => setSelectedOverrideReason(null)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
                <p className="font-bold text-amber-700 uppercase tracking-wider">Logged Override Reason:</p>
                <p className="font-medium text-sm leading-relaxed">{selectedOverrideReason}</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedOverrideReason(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-sm"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}

        <div><Footer /></div>
      </div>
    </LayoutWrapper>
  );
}
