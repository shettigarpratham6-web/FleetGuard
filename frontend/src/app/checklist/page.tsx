'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Checklist, Vehicle, User } from '@/types';
import Footer from '@/components/footer';

export default function ChecklistPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Form State
  const [form, setForm] = useState({
    vehicle_id: '',
    odometer_reading: '',
    brakes_status: 'Pass' as 'Pass' | 'Fail' | 'Attention',
    tires_status: 'Pass' as 'Pass' | 'Fail' | 'Attention',
    lights_status: 'Pass' as 'Pass' | 'Fail' | 'Attention',
    fluids_status: 'Pass' as 'Pass' | 'Fail' | 'Attention',
    notes: '',
  });

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = api.auth.getLocalUser();
    setCurrentUser(user);

    const loadData = async () => {
      try {
        setLoading(true);
        const [checklistsData, vehiclesData, usersData] = await Promise.all([
          api.checklists.getAll(),
          api.vehicles.getAll(),
          api.auth.getUsers(),
        ]);
        setChecklists(checklistsData || []);
        setVehicles(vehiclesData || []);
        setUsers(usersData || []);
      } catch (err: any) {
        console.error('Error fetching checklists data:', err);
        setError(err.message || 'Failed to load checklist data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const calculateOverallStatus = (): 'Passed' | 'Failed' | 'Attention Required' => {
    const statuses = [form.brakes_status, form.tires_status, form.lights_status, form.fluids_status];
    if (statuses.includes('Fail')) return 'Failed';
    if (statuses.includes('Attention')) return 'Attention Required';
    return 'Passed';
  };

  const handleSubmitChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess('');
    setError('');

    if (!form.vehicle_id) {
      setError('Please select a vehicle.');
      return;
    }

    try {
      setSubmitting(true);
      const overall = calculateOverallStatus();
      const newChecklist = await api.checklists.create({
        driver_id: currentUser?.id || '',
        vehicle_id: form.vehicle_id,
        odometer_reading: Number(form.odometer_reading) || 0,
        brakes_status: form.brakes_status,
        tires_status: form.tires_status,
        lights_status: form.lights_status,
        fluids_status: form.fluids_status,
        overall_status: overall,
        notes: form.notes,
      });

      setChecklists((prev) => [newChecklist, ...prev]);
      setSubmitSuccess('Pre-trip checklist successfully submitted!');
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess('');
        setForm({
          vehicle_id: '',
          odometer_reading: '',
          brakes_status: 'Pass',
          tires_status: 'Pass',
          lights_status: 'Pass',
          fluids_status: 'Pass',
          notes: '',
        });
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit checklist.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredChecklists = checklists.filter((c) => {
    const v = vehicles.find((veh) => veh.id === c.vehicle_id);
    const u = users.find((usr) => usr.id === c.driver_id);
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      v?.vehicle_number.toLowerCase().includes(query) ||
      v?.model.toLowerCase().includes(query) ||
      u?.full_name.toLowerCase().includes(query) ||
      c.overall_status.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' || c.overall_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPassed = checklists.filter((c) => c.overall_status === 'Passed').length;
  const totalFailed = checklists.filter((c) => c.overall_status === 'Failed').length;
  const totalAttention = checklists.filter((c) => c.overall_status === 'Attention Required').length;
  const passRate = checklists.length > 0 ? Math.round((totalPassed / checklists.length) * 100) : 100;

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-semibold text-sm text-slate-600">Loading Pre-Trip Inspection Logs...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper
      searchPlaceholder="Search vehicle, driver, or inspection status..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">

        {/* Page Title & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1 block">
              Safety & Compliance Control
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Pre-Trip Checklists
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Driver safety verification logs before dispatch and trip start
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              New Pre-Trip Checklist
            </button>
          </div>
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
            <span className="text-xs font-bold text-slate-400 uppercase">Total Inspections</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{checklists.length}</div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Logged in system</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase">Pass Rate</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{passRate}%</div>
            <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">{totalPassed} Passed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-amber-600 uppercase">Attention Required</span>
            <div className="text-3xl font-black text-amber-600 mt-1">{totalAttention}</div>
            <span className="text-[11px] font-semibold text-amber-600 mt-1 block">Minor issues noted</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-rose-600 uppercase">Failed Inspections</span>
            <div className="text-3xl font-black text-rose-600 mt-1">{totalFailed}</div>
            <span className="text-[11px] font-semibold text-rose-600 mt-1 block">Grounded assets</span>
          </div>
        </div>

        {/* Filter Bar & Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900">Inspection History</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Status:</span>
              {['All', 'Passed', 'Attention Required', 'Failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === st
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
                  <th className="p-4 pl-6">Vehicle</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Odometer</th>
                  <th className="p-4">Sub-Checks</th>
                  <th className="p-4">Overall Status</th>
                  <th className="p-4 pr-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredChecklists.length > 0 ? (
                  filteredChecklists.map((item) => {
                    const vehicle = vehicles.find((v) => v.id === item.vehicle_id);
                    const driver = users.find((u) => u.id === item.driver_id);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[18px]">directions_car</span>
                            </div>
                            <div>
                              <p className="font-mono text-xs font-bold text-slate-900">
                                {vehicle ? vehicle.vehicle_number : 'Vehicle #' + item.vehicle_id.slice(0, 5)}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium">{vehicle ? vehicle.model : ''}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-semibold text-slate-800">
                          {driver ? driver.full_name : 'Driver'}
                        </td>

                        <td className="p-4 font-mono text-xs font-bold text-slate-700">
                          {item.odometer_reading ? item.odometer_reading.toLocaleString() + ' mi' : 'N/A'}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold">
                            <span title={`Brakes: ${item.brakes_status}`} className={`px-2 py-0.5 rounded ${item.brakes_status === 'Pass' ? 'bg-emerald-50 text-emerald-600' : item.brakes_status === 'Attention' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                              Br: {item.brakes_status}
                            </span>
                            <span title={`Tires: ${item.tires_status}`} className={`px-2 py-0.5 rounded ${item.tires_status === 'Pass' ? 'bg-emerald-50 text-emerald-600' : item.tires_status === 'Attention' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                              Tr: {item.tires_status}
                            </span>
                            <span title={`Lights: ${item.lights_status}`} className={`px-2 py-0.5 rounded ${item.lights_status === 'Pass' ? 'bg-emerald-50 text-emerald-600' : item.lights_status === 'Attention' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                              Lt: {item.lights_status}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${item.overall_status === 'Passed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.overall_status === 'Attention Required'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {item.overall_status === 'Passed' ? 'check_circle' : item.overall_status === 'Attention Required' ? 'warning' : 'cancel'}
                            </span>
                            {item.overall_status}
                          </span>
                        </td>

                        <td className="p-4 pr-6 text-xs text-slate-500 font-medium">
                          {new Date(item.created_at || Date.now()).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs font-medium text-slate-500">
                      No inspection logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: SUBMIT NEW CHECKLIST */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">fact_check</span>
                  <h3 className="text-lg font-bold text-slate-900">Pre-Trip Safety Inspection</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {submitSuccess}
                </div>
              )}

              <form onSubmit={handleSubmitChecklist} className="space-y-4">
                {/* Vehicle Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Select Assigned Vehicle *</label>
                  <select
                    value={form.vehicle_id}
                    onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} ({v.manufacturer} {v.model})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Odometer */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Current Odometer (mi) *</label>
                  <input
                    type="number"
                    value={form.odometer_reading}
                    onChange={(e) => setForm({ ...form, odometer_reading: e.target.value })}
                    required
                    placeholder="e.g. 54200"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Inspection Check Items */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Safety Component Checks</p>

                  {[
                    { key: 'brakes_status', label: 'Brakes & Air Pressure' },
                    { key: 'tires_status', label: 'Tires & Tread Wear' },
                    { key: 'lights_status', label: 'Lights & Turn Signals' },
                    { key: 'fluids_status', label: 'Engine Oil & Coolant Fluids' },
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-xs font-bold text-slate-800">{item.label}</span>
                      <div className="flex gap-1">
                        {(['Pass', 'Attention', 'Fail'] as const).map((st) => (
                          <button
                            type="button"
                            key={st}
                            onClick={() => setForm({ ...form, [item.key]: st })}
                            className={`text-[11px] font-extrabold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                              (form as any)[item.key] === st
                                ? st === 'Pass'
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : st === 'Attention'
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Remarks / Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Additional Notes / Defect Details</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Describe any minor defect or observations..."
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
                    {submitting ? 'Submitting...' : 'Submit Inspection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div><Footer /></div>
      </div>
    </LayoutWrapper>
  );
}
