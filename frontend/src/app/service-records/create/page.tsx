'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, User } from '@/types';

interface PartItem {
  name: string;
  qty: number;
  unitCost: number;
}

export default function CreateServiceRecordPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [vehicleId, setVehicleId] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMileage, setCurrentMileage] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [laborCost, setLaborCost] = useState('250.00');

  // Parts List State
  const [parts, setParts] = useState<PartItem[]>([
    { name: 'Oil Filter (OF-192)', qty: 1, unitCost: 40.50 },
    { name: 'Synthetic Engine Oil 5W-30', qty: 4, unitCost: 36.12 }
  ]);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [vehiclesData, usersData] = await Promise.all([
          api.vehicles.getAll(),
          api.auth.getUsers()
        ]);
        setVehicles(vehiclesData || []);
        // filter mechanics or show all service center/staff
        setUsers(usersData ? usersData.filter(u => u.role === 'Service Center' || u.role === 'Admin') : []);
      } catch (err: any) {
        console.error('Error fetching creation details:', err);
        setError(err.message || 'Failed to retrieve options from database.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Handle adding new part row
  const addPartRow = () => {
    setParts([...parts, { name: '', qty: 1, unitCost: 0.00 }]);
  };

  // Handle changing part fields
  const handlePartChange = (index: number, key: keyof PartItem, value: string | number) => {
    const updated = [...parts];
    if (key === 'qty') {
      updated[index].qty = Math.max(1, Number(value));
    } else if (key === 'unitCost') {
      updated[index].unitCost = Math.max(0, Number(value));
    } else {
      updated[index].name = String(value);
    }
    setParts(updated);
  };

  // Handle removing part row
  const removePartRow = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  // Cost calculations
  const partsTotal = parts.reduce((acc, part) => acc + part.qty * part.unitCost, 0);
  const totalCost = partsTotal + Number(laborCost || 0);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!vehicleId || !mechanicId || !serviceType || !currentMileage) {
      setError('Please fill out all required fields marked with *');
      return;
    }

    const partsString = parts
      .filter((p) => p.name.trim() !== '')
      .map((p) => `${p.name} (x${p.qty})`)
      .join(', ');

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
        next_service_date: new Date(new Date().setMonth(new Date().getMonth() + 6))
          .toISOString()
          .split('T')[0]
      });

      router.push('/service-records');
    } catch (err: any) {
      console.error('Error creating service record:', err);
      setError(err.message || 'Failed to submit service record to database.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body-md text-on-surface-variant">Preparing service records form...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper searchPlaceholder="Search forms...">
      <div className="max-w-4xl mx-auto p-margin-mobile md:p-margin-desktop space-y-lg">
        {/* Header */}
        <div className="mb-xl flex items-center justify-between pb-sm border-b border-outline-variant/30">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface">Create Service Record</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-sm">
              Log maintenance, repairs, and inspections for fleet assets.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-md rounded-xl bg-error-container/10 border border-error-container/30 text-error text-body-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {/* Form Container */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-outline-variant">
            
            {/* Section 1: Asset & Personnel */}
            <div className="p-lg">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Asset & Personnel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Vehicle / Asset *
                  </label>
                  <select
                    required
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-colors outline-none"
                  >
                    <option value="" disabled>Select an asset</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} ({v.manufacturer} {v.model})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Assigned Mechanic *
                  </label>
                  <select
                    required
                    value={mechanicId}
                    onChange={(e) => setMechanicId(e.target.value)}
                    className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-colors outline-none"
                  >
                    <option value="" disabled>Select personnel</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Service Details */}
            <div className="p-lg">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Service Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-lg">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Date of Service *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                      calendar_today
                    </span>
                    <input
                      required
                      type="date"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary pl-[40px] pr-md py-sm text-body-md font-body-md text-on-surface transition-colors outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Current Mileage *
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      placeholder="0"
                      value={currentMileage}
                      onChange={(e) => setCurrentMileage(e.target.value)}
                      className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-data-mono font-data-mono text-on-surface transition-colors text-right outline-none"
                    />
                    <span className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant font-body-sm text-body-sm pointer-events-none">
                      mi
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Service Type *
                  </label>
                  <select
                    required
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-colors outline-none"
                  >
                    <option value="" disabled>Select type</option>
                    <option value="Routine Maintenance">Routine Maintenance</option>
                    <option value="Emergency Repair">Emergency Repair</option>
                    <option value="Inspection (MOT)">Inspection (MOT)</option>
                    <option value="Transmission Overhaul">Transmission Overhaul</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs">
                  Description of Work
                </label>
                <textarea
                  placeholder="Detail the work performed, issues found, and general observations..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-colors resize-none outline-none"
                />
              </div>
            </div>

            {/* Section 3: Parts & Labor Allocation */}
            <div className="p-lg bg-surface-container-low">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">
                Parts & Labor Allocation
              </h3>
              
              {/* Parts Table */}
              <div className="mb-lg border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container border-b border-outline-variant">
                    <tr>
                      <th className="p-sm font-label-md text-label-md text-on-surface">
                        Part Name / Number
                      </th>
                      <th className="p-sm font-label-md text-label-md text-on-surface w-24 text-center">
                        Qty
                      </th>
                      <th className="p-sm font-label-md text-label-md text-on-surface w-32 text-right">
                        Unit Cost
                      </th>
                      <th className="p-sm font-label-md text-label-md text-on-surface w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
                    {parts.map((part, index) => (
                      <tr key={index} className="hover:bg-surface-container-high transition-colors">
                        <td className="p-sm">
                          <input
                            type="text"
                            placeholder="e.g., Brake Pads (BP-902)"
                            value={part.name}
                            onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-body-md placeholder:text-on-surface-variant/50 outline-none"
                          />
                        </td>
                        <td className="p-sm">
                          <input
                            type="number"
                            min="1"
                            value={part.qty}
                            onChange={(e) => handlePartChange(index, 'qty', e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-data-mono text-center outline-none"
                          />
                        </td>
                        <td className="p-sm text-right">
                          <div className="flex items-center justify-end gap-xs">
                            <span className="text-on-surface-variant font-data-mono">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={part.unitCost || ''}
                              onChange={(e) => handlePartChange(index, 'unitCost', e.target.value)}
                              className="w-20 bg-transparent border-none focus:ring-0 p-0 text-data-mono text-right outline-none"
                            />
                          </div>
                        </td>
                        <td className="p-sm text-center">
                          <button
                            type="button"
                            onClick={() => removePartRow(index)}
                            className="text-on-surface-variant hover:text-error transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-sm border-t border-outline-variant bg-surface-container">
                  <button
                    type="button"
                    onClick={addPartRow}
                    className="font-label-md text-label-md text-primary flex items-center gap-xs hover:underline cursor-pointer border-none bg-transparent"
                  >
                    <span className="material-symbols-outlined text-sm">add</span> Add Part
                  </button>
                </div>
              </div>

              {/* Costs Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-end">
                <div className="space-y-md">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-xs">
                    <span className="font-body-md text-body-md text-on-surface-variant">Parts Total:</span>
                    <span className="font-data-mono text-data-mono text-on-surface">
                      ${partsTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-outline-variant pb-xs">
                    <label className="font-body-md text-body-md text-on-surface-variant flex items-center gap-xs">
                      Labor Cost:
                    </label>
                    <div className="relative w-32">
                      <span className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant font-data-mono text-data-mono pointer-events-none">
                        $
                      </span>
                      <input
                        type="number"
                        step="1"
                        value={laborCost}
                        onChange={(e) => setLaborCost(e.target.value)}
                        className="w-full bg-surface-container rounded-md border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary pl-[20px] pr-sm py-1 text-data-mono font-data-mono text-on-surface text-right transition-colors outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-sm">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Total Service Cost:
                    </span>
                    <span className="font-display-lg text-[24px] text-primary font-bold tracking-tight">
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* PDF Invoice Upload placeholder */}
                <div className="flex flex-col items-end justify-end h-full">
                  <button
                    type="button"
                    className="px-md py-sm border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-sm hover:bg-surface-container transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                      upload_file
                    </span>
                    Upload Invoice PDF
                  </button>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                    Max file size: 10MB
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Form Actions */}
            <div className="p-lg bg-surface-container-lowest flex items-center justify-end gap-md">
              <button
                type="button"
                onClick={() => router.push('/service-records')}
                className="px-lg py-sm rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer border-none bg-transparent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-lg py-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-colors shadow-sm flex items-center gap-sm cursor-pointer active:opacity-85 border-none"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      save
                    </span>
                    <span>Save Service Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </LayoutWrapper>
  );
}
