"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import Footer from '@/components/Footer';
import { api } from '@/services/api';

export default function LogbookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState('inspection'); // 'inspection' or 'fuel'
  const [submitStatus, setSubmitStatus] = useState({ type: '', msg: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Passed',
    notes: '',
    gallons: '',
    cost: '',
    odometer: '',
    station: ''
  });

  // Real checklist data from backend
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = api.auth.getLocalUser();
    if (currentUser) {
      if (['Admin', 'Fleet Manager', 'Manager'].includes(currentUser.role)) {
        router.push('/dashboard');
        return;
      }
      if (currentUser.role === 'Service Center') {
        router.push('/mechanic');
        return;
      }
    }

    const fetchInitialData = async () => {
      try {
        const currentUser = api.auth.getLocalUser();
        setUser(currentUser);
        const [fetchedVehicles, myChecklists] = await Promise.all([
          api.vehicles.getAll(),
          api.checklists.getMyChecklists()
        ]);
        setVehicles(fetchedVehicles || []);
        // Map checklists into inspection display format
        const mappedInspections = (myChecklists || []).map((c: any) => ({
          id: c.id,
          date: c.checklist_date,
          status: (c.tyres_ok && c.brakes_ok && c.lights_ok && c.horn_ok && c.mirrors_ok) ? 'Passed' : 'Warning',
          notes: c.remarks || 'Pre-trip checklist completed.',
          vehicle: c.vehicle_number || 'Vehicle'
        }));
        setInspections(mappedInspections);
      } catch (err) {
        console.error('Failed to load logbook data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: '', msg: '' });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId) || { manufacturer: 'Unknown', model: 'Vehicle' };
      const vehicleName = `${selectedVehicle.manufacturer} ${selectedVehicle.model}`;

      if (entryType === 'inspection') {
        // Submit to real API
        const allPassed = formData.status === 'Passed';
        await api.checklists.create({
          vehicle_id: formData.vehicleId,
          tyres_ok: allPassed,
          brakes_ok: allPassed,
          lights_ok: allPassed,
          horn_ok: allPassed,
          mirrors_ok: allPassed,
          remarks: formData.notes || undefined
        });
        const matchedVehicle = vehicles.find(v => v.id === formData.vehicleId) || { manufacturer: 'Unknown', model: 'Vehicle' };
        const newInsp = {
          id: Date.now(),
          date: formData.date,
          status: formData.status,
          notes: formData.notes || 'Routine check.',
          vehicle: `${matchedVehicle.manufacturer} ${matchedVehicle.model}`
        };
        setInspections([newInsp, ...inspections]);
      } else {
        const newFuel = {
          id: Date.now(),
          date: formData.date,
          gallons: parseFloat(formData.gallons),
          cost: parseFloat(formData.cost),
          odometer: parseInt(formData.odometer, 10),
          station: formData.station || 'Local Station'
        };
        setFuelLogs([newFuel, ...fuelLogs]);
      }

      setSubmitStatus({ type: 'success', msg: 'Entry saved successfully to your logbook!' });

      // Reset form
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitStatus({ type: '', msg: '' });
        setFormData({
          vehicleId: '', date: new Date().toISOString().split('T')[0], status: 'Passed', notes: '', gallons: '', cost: '', odometer: '', station: ''
        });
      }, 1500);

    } catch (err: any) {
      setSubmitStatus({ type: 'error', msg: 'Failed to save entry.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-semibold text-sm text-slate-600">Loading your logbook...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-5xl mx-auto bg-slate-50 min-h-screen text-slate-900 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              My Logbook
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              Track your daily inspections and fuel logs.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Entry
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Daily Inspections Section */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-[22px]">fact_check</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Recent Inspections</h3>
            </div>

            <div className="space-y-4">
              {inspections.map((insp) => (
                <div key={insp.id} className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {insp.date}
                      </span>
                      <p className="text-sm font-bold text-slate-900">{insp.vehicle}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${insp.status === 'Passed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {insp.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">{insp.notes}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
              View All Inspections
            </button>
          </div>

          {/* Fuel Logs Section */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined text-[22px]">local_gas_station</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Fuel Logs</h3>
            </div>

            <div className="space-y-4">
              {fuelLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {log.date} • {log.station}
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {log.gallons} Gal @ {log.odometer.toLocaleString()} mi
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">${log.cost.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
              View All Fuel Logs
            </button>
          </div>

        </div>

        {/* NEW ENTRY MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white rounded-[1.5rem] shadow-2xl overflow-hidden animate-slide-up transform transition-all border border-slate-100 relative my-auto shrink-0" style={{ width: '100%', maxWidth: '28rem' }} onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-1.5 rounded-lg">post_add</span>
                  Create Logbook Entry
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6">
                {submitStatus.msg && (
                  <div className={`p-3 rounded-xl mb-5 text-sm font-semibold flex items-center gap-2 ${submitStatus.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {submitStatus.type === 'error' ? 'error' : 'check_circle'}
                    </span>
                    {submitStatus.msg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Entry Type Toggle */}
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button
                      type="button"
                      onClick={() => setEntryType('inspection')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${entryType === 'inspection' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Daily Inspection
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryType('fuel')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${entryType === 'fuel' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Log Fuel
                    </button>
                  </div>

                  {/* Common Fields */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Vehicle</label>
                    <select
                      name="vehicleId"
                      value={formData.vehicleId}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.manufacturer} {v.model} ({v.registration_number || v.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Conditional Fields: Inspection */}
                  {entryType === 'inspection' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inspection Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Passed">Passed - Safe to Drive</option>
                          <option value="Warning">Warning - Minor Issues</option>
                          <option value="Failed">Failed - Do Not Drive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Issues Found</label>
                        <textarea
                          name="notes"
                          rows={3}
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="e.g. Checked tires, all fluids good..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Conditional Fields: Fuel Log */}
                  {entryType === 'fuel' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gallons/Liters</label>
                          <input
                            type="number"
                            step="0.01"
                            name="gallons"
                            value={formData.gallons}
                            onChange={handleInputChange}
                            placeholder="e.g. 15.4"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Cost ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            name="cost"
                            value={formData.cost}
                            onChange={handleInputChange}
                            placeholder="e.g. 45.00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Odometer (mi)</label>
                          <input
                            type="number"
                            name="odometer"
                            value={formData.odometer}
                            onChange={handleInputChange}
                            placeholder="e.g. 45210"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gas Station</label>
                          <input
                            type="text"
                            name="station"
                            value={formData.station}
                            onChange={handleInputChange}
                            placeholder="e.g. Shell #442"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-3 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : 'Save Entry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div><Footer /></div>
      </div>
    </LayoutWrapper>
  );
}
