'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { ServiceRecord, Vehicle, User } from '@/types';

export default function ServiceRecordDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [mechanic, setMechanic] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const allServices = await api.services.getAll();
        const foundRecord = allServices.find(s => s.id === id);
        
        if (!foundRecord) {
          setError('Service record not found.');
          return;
        }
        setRecord(foundRecord);

        // Fetch associated vehicle and users
        const [allVehicles, allUsers] = await Promise.all([
          api.vehicles.getAll(),
          api.auth.getUsers()
        ]);

        setVehicle(allVehicles.find(v => v.id === foundRecord.vehicle_id) || null);
        setMechanic(allUsers.find(u => u.id === foundRecord.mechanic_id) || null);
      } catch (err: any) {
        console.error('Error fetching service details:', err);
        setError(err.message || 'Failed to load service record details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body-md text-on-surface-variant">Loading service record details...</p>
        </div>
      </LayoutWrapper>
    );
  }

  if (error || !record) {
    return (
      <LayoutWrapper>
        <div className="p-lg md:p-margin-desktop text-center">
          <div className="p-md rounded-xl bg-error-container/10 border border-error-container/30 text-error text-body-md inline-flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error || 'Service record not found'}
          </div>
          <div className="mt-md">
            <button 
              onClick={() => router.back()}
              className="bg-primary text-on-primary px-md py-sm rounded-lg font-semibold hover:opacity-90 active:opacity-85 cursor-pointer border-none"
            >
              Go Back
            </button>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  // Compute breakdown costs
  const partsCost = Number(record.parts_cost) || 0;
  const labourCost = Number(record.labour_cost) || 0;
  const suppliesCost = partsCost > 0 || labourCost > 0 ? 45.00 : 0;
  const taxCost = (partsCost + labourCost + suppliesCost) * 0.08;
  const grandTotal = Number(record.total_cost) || (partsCost + labourCost + suppliesCost + taxCost);

  return (
    <LayoutWrapper searchPlaceholder="Search this record...">
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
        
        {/* Breadcrumb Action */}
        <div className="pb-sm border-b border-surface-variant flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs font-body-md text-body-md cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Records
          </button>
        </div>

        {/* Page Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
          <div>
            <div className="flex items-center gap-sm mb-xs">
              <span className="font-data-mono text-data-mono text-on-surface-variant uppercase">
                SR-RECORD-{record.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md px-sm py-[2px] rounded-full">
                Completed
              </span>
            </div>
            <h1 className="font-display-lg text-display-lg text-primary">{record.service_type}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Recorded on {new Date(record.service_date).toLocaleDateString()} • Facility: Central Hub North
            </p>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={() => window.print()}
              className="bg-surface-container-highest text-on-surface font-label-md text-label-md px-lg py-sm rounded-md flex items-center gap-sm border border-outline-variant hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print/Download
            </button>
            <button className="bg-primary-container text-on-primary-container font-label-md text-label-md px-lg py-sm rounded-md flex items-center gap-sm hover:opacity-90 transition-opacity cursor-pointer border-none">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Record
            </button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column (Service Info) */}
          <div className="lg:col-span-8 space-y-gutter">
            
            {/* Description Card */}
            <section className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-md pb-sm border-b border-surface-variant">
                Service Description
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {record.description || 'No description provided for this service record.'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md mt-lg pt-md border-t border-surface-variant">
                <div>
                  <span className="block font-label-md text-label-md text-on-surface-variant mb-xs">
                    ODOMETER
                  </span>
                  <span className="font-data-mono text-data-mono text-on-surface">
                    {record.current_mileage.toLocaleString()} mi
                  </span>
                </div>
                <div>
                  <span className="block font-label-md text-label-md text-on-surface-variant mb-xs">
                    HOURS LOGGED
                  </span>
                  <span className="font-data-mono text-data-mono text-on-surface">18.5 hrs</span>
                </div>
                <div>
                  <span className="block font-label-md text-label-md text-on-surface-variant mb-xs">
                    SERVICE TYPE
                  </span>
                  <span className="font-data-mono text-data-mono text-on-surface">Corrective</span>
                </div>
                <div>
                  <span className="block font-label-md text-label-md text-on-surface-variant mb-xs">
                    WARRANTY
                  </span>
                  <span className="font-data-mono text-data-mono text-on-surface text-on-tertiary-container">
                    Covered - Partial
                  </span>
                </div>
              </div>
            </section>

            {/* Parts Changed List */}
            <section className="bg-surface-container-lowest border border-surface-variant rounded-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-lg border-b border-surface-variant">
                <h2 className="font-headline-sm text-headline-sm text-primary">Parts & Materials</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low font-label-md text-label-md text-on-surface-variant border-b border-surface-variant">
                    <tr>
                      <th className="py-sm px-lg font-medium">Part Description</th>
                      <th className="py-sm px-lg font-medium text-right w-24">Qty</th>
                      <th className="py-sm px-lg font-medium text-right w-32">Allocated Cost</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md">
                    {(record.parts_changed || '')
                      .split(',')
                      .filter(Boolean)
                      .map((part, index) => (
                        <tr
                          key={index}
                          className="border-b border-surface-variant hover:bg-surface-container-low transition-colors"
                        >
                          <td className="py-md px-lg text-on-surface">{part.trim()}</td>
                          <td className="py-md px-lg text-right text-on-surface">1</td>
                          <td className="py-md px-lg text-right font-data-mono text-data-mono text-on-surface-variant text-sm">
                            Included
                          </td>
                        </tr>
                      ))}
                    {(!record.parts_changed || record.parts_changed.trim() === '') && (
                      <tr>
                        <td colSpan={3} className="py-md px-lg text-center text-on-surface-variant">
                          No parts were recorded as changed during this service.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right Column (Profiles & Costs) */}
          <div className="lg:col-span-4 space-y-gutter">
            
            {/* Entities Linked */}
            <section className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg space-y-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]">
              {/* Vehicle Link */}
              <div>
                <span className="block font-label-md text-label-md text-on-surface-variant mb-md uppercase tracking-wider">
                  Associated Vehicle
                </span>
                {vehicle ? (
                  <Link href={`/vehicles/${vehicle.id}`}>
                    <div className="flex items-center gap-md p-md bg-surface border border-outline-variant rounded-md hover:border-primary transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-secondary-container rounded flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                        <span className="material-symbols-outlined">local_shipping</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface text-[16px]">
                          {vehicle.vehicle_number}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                          {vehicle.manufacturer} {vehicle.model}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                        chevron_right
                      </span>
                    </div>
                  </Link>
                ) : (
                  <p className="text-on-surface-variant font-body-sm">No vehicle linked.</p>
                )}
              </div>

              {/* Mechanic Link */}
              <div>
                <span className="block font-label-md text-label-md text-on-surface-variant mb-md uppercase tracking-wider">
                  Lead Technician
                </span>
                <div className="flex items-center gap-md p-md bg-surface border border-outline-variant rounded-md hover:border-primary transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-surface-variant">
                    {mechanic?.profile_picture ? (
                      <img
                        alt={mechanic.full_name}
                        className="w-full h-full object-cover"
                        src={mechanic.profile_picture}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-secondary">person</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface text-[16px]">
                      {mechanic?.full_name || 'Marcus Johnson'}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs capitalize">
                      {mechanic?.role || 'Senior Specialist'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Cost Summary */}
            <section className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-md pb-sm border-b border-surface-variant flex items-center gap-sm">
                <span className="material-symbols-outlined">receipt_long</span>
                Invoice Preview
              </h2>
              <div className="space-y-sm font-data-mono text-data-mono">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Parts Total</span>
                  <span>${partsCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Labor Cost</span>
                  <span>${labourCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Shop Supplies</span>
                  <span>${suppliesCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Tax (8%)</span>
                  <span>${taxCost.toFixed(2)}</span>
                </div>
                <div className="pt-md mt-md border-t border-surface-variant flex justify-between font-headline-md text-headline-md text-primary">
                  <span>Total Cost</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <button className="w-full mt-lg bg-surface-container-high text-on-surface font-label-md text-label-md py-sm rounded-md border border-outline-variant hover:bg-surface-variant transition-colors flex items-center justify-center gap-sm cursor-pointer active:bg-surface-container-highest">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download Full PDF
              </button>
            </section>
          </div>
        </div>

      </div>
    </LayoutWrapper>
  );
}
