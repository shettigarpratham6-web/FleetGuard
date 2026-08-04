'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, User } from '@/types';

interface PartItem {
  name: string;
  qty: number;
  unitCost: number;
}

const inputClass =
  'w-full bg-surface-container-low rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15 px-4 py-3 text-[13.5px] text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50';

const selectClass =
  'w-full bg-surface-container-low rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15 px-4 py-3 text-[13.5px] text-on-surface transition-all outline-none cursor-pointer';

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[13px] font-semibold text-on-surface mb-1.5">
      {children}
      {required && <span className="text-error ml-0.5" aria-label="required">*</span>}
    </label>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/50">
        <h3 className="font-bold text-[15px] text-on-surface">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function CreateServiceRecordPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [vehicleId, setVehicleId] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMileage, setCurrentMileage] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [laborCost, setLaborCost] = useState('250.00');

  const [parts, setParts] = useState<PartItem[]>([
    { name: 'Oil Filter (OF-192)', qty: 1, unitCost: 40.50 },
    { name: 'Synthetic Engine Oil 5W-30', qty: 4, unitCost: 36.12 },
  ]);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) { router.push('/login'); return; }
    const currentUser = api.auth.getLocalUser();
    if (currentUser && currentUser.role === 'Driver') { router.push('/driver'); return; }
    const loadData = async () => {
      try {
        setLoading(true);
        const [vehiclesData, usersData] = await Promise.all([api.vehicles.getAll(), api.auth.getUsers()]);
        setVehicles(vehiclesData || []);
        setUsers(usersData ? usersData.filter(u => u.role === 'Service Center' || u.role === 'Admin') : []);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve options from database.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  const addPartRow = () => setParts([...parts, { name: '', qty: 1, unitCost: 0 }]);

  const handlePartChange = (index: number, key: keyof PartItem, value: string | number) => {
    const updated = [...parts];
    if (key === 'qty') updated[index].qty = Math.max(1, Number(value));
    else if (key === 'unitCost') updated[index].unitCost = Math.max(0, Number(value));
    else updated[index].name = String(value);
    setParts(updated);
  };

  const removePartRow = (index: number) => setParts(parts.filter((_, i) => i !== index));

  const partsTotal = parts.reduce((acc, p) => acc + p.qty * p.unitCost, 0);
  const totalCost = partsTotal + Number(laborCost || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!vehicleId || !mechanicId || !serviceType || !currentMileage) {
      setError('Please fill out all required fields (marked with *).');
      return;
    }
    const partsString = parts.filter(p => p.name.trim()).map(p => `${p.name} (x${p.qty})`).join(', ');
    setSubmitting(true);
    try {
      await api.services.create({
        vehicle_id: vehicleId,
        mechanic_id: mechanicId,
        service_date: serviceDate,
        current_mileage: Number(currentMileage),
        service_type: serviceType,
        description,
        parts_changed: partsString || 'None',
        labour_cost: Number(laborCost),
        parts_cost: partsTotal,
        total_cost: totalCost,
        next_service_mileage: Number(currentMileage) + 10000,
        next_service_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
      });
      setSuccess(true);
      setTimeout(() => router.push('/service-records'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit service record to database.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="max-w-4xl mx-auto p-lg md:p-margin-desktop space-y-6">
          <div className="skeleton h-8 w-52 rounded-lg" />
          <div className="skeleton h-4 w-72 rounded" />
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-outline-variant/60 p-6 shadow-sm space-y-4">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="grid grid-cols-2 gap-4">
                <div className="skeleton h-11 rounded-xl" />
                <div className="skeleton h-11 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper searchPlaceholder="Search forms...">
      <div className="max-w-4xl mx-auto p-lg md:p-margin-desktop space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40 animate-fade-in-up">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-[12.5px] font-medium mb-2 cursor-pointer border-0 bg-transparent focus-ring rounded-lg"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
              Back to Records
            </button>
            <h2 className="font-black text-[26px] text-primary">Create Service Record</h2>
            <p className="text-[13px] text-on-surface-variant mt-1">
              Log maintenance, repairs, and inspections for fleet assets.
            </p>
          </div>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 flex items-center gap-3 animate-fade-in shadow-sm">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px] text-green-600 fill" aria-hidden="true">check_circle</span>
            </div>
            <div>
              <p className="font-bold text-[13.5px]">Service record created successfully!</p>
              <p className="text-[12px] opacity-80">Redirecting to records list...</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-error-container/15 border border-error/25 text-error flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-[20px] flex-shrink-0" aria-hidden="true">error</span>
            <p className="text-[13px] font-medium">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-error/70 hover:text-error transition-colors cursor-pointer border-0 bg-transparent focus-ring rounded">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* Section 1: Asset & Personnel */}
          <div className="animate-fade-in-up">
            <SectionCard title="Asset & Personnel">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label required>Vehicle / Asset</Label>
                  <select required value={vehicleId} onChange={e => setVehicleId(e.target.value)} className={`${selectClass} ${!vehicleId && 'text-on-surface-variant/60'}`}>
                    <option value="" disabled>Select an asset</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.vehicle_number} ({v.manufacturer} {v.model})</option>
                    ))}
                  </select>
                  {vehicles.length === 0 && <p className="text-[11px] text-on-surface-variant mt-1">No vehicles found in database.</p>}
                </div>
                <div>
                  <Label required>Assigned Mechanic</Label>
                  <select required value={mechanicId} onChange={e => setMechanicId(e.target.value)} className={`${selectClass} ${!mechanicId && 'text-on-surface-variant/60'}`}>
                    <option value="" disabled>Select personnel</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                  {users.length === 0 && <p className="text-[11px] text-on-surface-variant mt-1">No service center personnel found.</p>}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Section 2: Service Details */}
          <div className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
            <SectionCard title="Service Details">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <div>
                  <Label required>Date of Service</Label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 pointer-events-none text-[18px]" aria-hidden="true">calendar_today</span>
                    <input
                      required type="date" value={serviceDate}
                      onChange={e => setServiceDate(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <Label required>Current Mileage</Label>
                  <div className="relative">
                    <input
                      required type="number" placeholder="0"
                      value={currentMileage} onChange={e => setCurrentMileage(e.target.value)}
                      className={`${inputClass} pr-10 text-right font-mono`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[12px] pointer-events-none">mi</span>
                  </div>
                </div>
                <div>
                  <Label required>Service Type</Label>
                  <select required value={serviceType} onChange={e => setServiceType(e.target.value)} className={`${selectClass} ${!serviceType && 'text-on-surface-variant/60'}`}>
                    <option value="" disabled>Select type</option>
                    <option>Routine Maintenance</option>
                    <option>Emergency Repair</option>
                    <option>Inspection (MOT)</option>
                    <option>Transmission Overhaul</option>
                    <option>Brake Service</option>
                    <option>Oil Change</option>
                    <option>Tire Replacement</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Description of Work</Label>
                <textarea
                  placeholder="Detail the work performed, issues found, and general observations..."
                  rows={4}
                  value={description} onChange={e => setDescription(e.target.value)}
                  className={inputClass + ' resize-none'}
                />
              </div>
            </SectionCard>
          </div>

          {/* Section 3: Parts & Labor */}
          <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/50">
                <h3 className="font-bold text-[15px] text-on-surface">Parts & Labor Allocation</h3>
              </div>
              <div className="p-6">
                {/* Parts Table */}
                <div className="mb-6 border border-outline-variant/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse" role="table" aria-label="Parts list">
                    <thead className="bg-surface-container-low border-b border-outline-variant/40">
                      <tr>
                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Part Name / Number</th>
                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant w-20 text-center">Qty</th>
                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant w-32 text-right">Unit Cost</th>
                        <th className="px-4 py-3 w-10" aria-hidden="true" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {parts.map((part, index) => (
                        <tr key={index} className="hover:bg-surface-container-low/60 transition-colors group">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              placeholder="e.g., Brake Pads (BP-902)"
                              value={part.name}
                              onChange={e => handlePartChange(index, 'name', e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-0 text-[13px] placeholder:text-on-surface-variant/40 outline-none text-on-surface"
                              aria-label={`Part ${index + 1} name`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number" min="1" value={part.qty}
                              onChange={e => handlePartChange(index, 'qty', e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-0 text-[13px] font-mono text-center outline-none text-on-surface"
                              aria-label={`Part ${index + 1} quantity`}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-on-surface-variant font-mono text-[13px]">$</span>
                              <input
                                type="number" step="0.01" min="0" placeholder="0.00"
                                value={part.unitCost || ''}
                                onChange={e => handlePartChange(index, 'unitCost', e.target.value)}
                                className="w-20 bg-transparent border-0 focus:ring-0 text-[13px] font-mono text-right outline-none text-on-surface"
                                aria-label={`Part ${index + 1} unit cost`}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removePartRow(index)}
                              className="text-on-surface-variant/40 hover:text-error transition-colors cursor-pointer border-0 bg-transparent opacity-0 group-hover:opacity-100 focus-ring rounded"
                              aria-label={`Remove part ${index + 1}`}
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-outline-variant/30 bg-surface-container-low/40">
                    <button
                      type="button"
                      onClick={addPartRow}
                      className="flex items-center gap-1.5 text-[13px] text-primary font-semibold hover:underline cursor-pointer border-0 bg-transparent focus-ring rounded"
                    >
                      <span className="material-symbols-outlined text-[17px]" aria-hidden="true">add</span>
                      Add Part
                    </button>
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="bg-surface-container-low rounded-2xl p-5 space-y-3 border border-outline-variant/40">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-on-surface-variant">Parts Total</span>
                      <span className="font-mono font-semibold text-on-surface">${partsTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <label className="text-on-surface-variant">Labor Cost</label>
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono text-[13px] pointer-events-none">$</span>
                        <input
                          type="number" step="1" value={laborCost}
                          onChange={e => setLaborCost(e.target.value)}
                          className="w-full bg-white border border-outline-variant/60 rounded-lg pl-6 pr-3 py-1.5 font-mono text-[13px] text-right text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                          aria-label="Labor cost"
                        />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                      <span className="font-bold text-[15px] text-on-surface">Total Service Cost</span>
                      <span className="font-black text-[22px] text-primary">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-3 border border-outline-variant/60 rounded-xl bg-surface-container-low text-on-surface text-[13px] font-medium hover:bg-surface-container-high transition-colors shadow-sm cursor-pointer btn-scale focus-ring"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]" aria-hidden="true">upload_file</span>
                      Upload Invoice PDF
                    </button>
                    <span className="text-[11px] text-on-surface-variant">Max file size: 10MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-6 animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            <button
              type="button"
              onClick={() => router.push('/service-records')}
              className="px-6 py-3 rounded-xl text-[13px] font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer border-0 bg-transparent focus-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="px-8 py-3 rounded-xl text-white text-[13px] font-bold flex items-center gap-2.5 cursor-pointer btn-scale border-0 shadow-md focus-ring disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined text-[18px] fill" aria-hidden="true">check_circle</span>
                  Saved!
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">save</span>
                  Save Service Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </LayoutWrapper>
  );
}
