'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, ServiceRecord } from '@/types';

// Skeleton for stat cards
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm space-y-3">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-8 w-24 rounded" />
      <div className="skeleton h-2 w-32 rounded" />
    </div>
  );
}

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
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
        // ✅ Fixed: uses real API instead of mockDb
        const vehicleData = await api.vehicles.getById(id);
        setVehicle(vehicleData);

        const allServices = await api.services.getAll();
        setServiceRecords(allServices.filter((sr) => sr.vehicle_id === id));
      } catch (err: any) {
        console.error('Error fetching vehicle details:', err);
        setError(err.message || 'Failed to load vehicle details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  // Loading state
  if (loading) {
    return (
      <LayoutWrapper>
        <div className="p-lg md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="skeleton h-4 w-16 rounded" />
          </div>
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2"><StatCardSkeleton /></div>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="skeleton w-5 h-5 rounded-full mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-48 rounded" />
                    <div className="skeleton h-3 w-64 rounded" />
                    <div className="skeleton h-3 w-40 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  // Error state
  if (error || !vehicle) {
    return (
      <LayoutWrapper>
        <div className="p-lg md:p-margin-desktop text-center max-w-md mx-auto mt-16">
          <div className="w-16 h-16 bg-error-container rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-error" aria-hidden="true">directions_car_off</span>
          </div>
          <h2 className="font-bold text-[18px] text-on-surface mb-2">Vehicle Not Found</h2>
          <p className="text-[13px] text-on-surface-variant mb-6">{error || 'The vehicle you are looking for does not exist or has been removed.'}</p>
          <button
            onClick={() => router.back()}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-[13px] hover:opacity-90 active:scale-95 cursor-pointer border-0 btn-scale focus-ring"
          >
            Go Back
          </button>
        </div>
      </LayoutWrapper>
    );
  }

  const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    Maintenance: { bg: 'bg-error-container', text: 'text-error', border: 'border-error/30', dot: 'bg-error' },
    Assigned:    { bg: 'bg-primary-fixed', text: 'text-primary', border: 'border-primary/30', dot: 'bg-primary' },
    Available:   { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
    Inactive:    { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', border: 'border-outline-variant', dot: 'bg-outline' },
  };
  const sc = statusConfig[vehicle.status] || statusConfig['Available'];

  const totalSpend = serviceRecords.reduce((acc, sr) => acc + Number(sr.total_cost), 0);
  const lastService = serviceRecords.sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())[0];

  return (
    <LayoutWrapper searchPlaceholder="Search services for this vehicle...">
      <div className="p-lg md:p-margin-desktop max-w-7xl mx-auto space-y-lg">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 pb-4 border-b border-outline-variant/40 animate-fade-in-up">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-[13px] font-medium cursor-pointer border-0 bg-transparent focus-ring rounded-lg p-1 -ml-1"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
            Back
          </button>
          <span className="text-outline-variant" aria-hidden="true">/</span>
          <span className="text-[13px] text-on-surface-variant">Vehicles</span>
          <span className="text-outline-variant" aria-hidden="true">/</span>
          <span className="text-[13px] font-semibold text-on-surface font-mono">{vehicle.vehicle_number}</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} aria-hidden="true" />
                {vehicle.status}
              </span>
              <span className="font-mono text-[12px] text-on-surface-variant">
                VIN: {vehicle.registration_number}
              </span>
            </div>
            <h2 className="font-black text-[26px] md:text-[30px] text-primary leading-tight">
              Asset {vehicle.vehicle_number}
            </h2>
            <p className="text-[13px] text-on-surface-variant mt-1">
              {vehicle.manufacturer} {vehicle.model} • {vehicle.manufacturing_year || 'N/A'} • {vehicle.fuel_type || 'N/A'}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href="/service-records/create">
              <button className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-[13px] font-semibold shadow-md cursor-pointer btn-scale border-0 focus-ring hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
                New Service Record
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Bento Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children" aria-label="Vehicle statistics">
          {/* Main Info Card */}
          <div className="col-span-2 bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm hover:shadow-md transition-all card-hover flex gap-5 items-center animate-fade-in-up relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5">
              <span className="material-symbols-outlined text-[120px] text-primary" aria-hidden="true">
                {vehicle.vehicle_type === 'Light Van' ? 'directions_car' : 'local_shipping'}
              </span>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex-shrink-0 border border-outline-variant/40 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[40px] text-primary/60" aria-hidden="true">
                {vehicle.vehicle_type === 'Light Van' ? 'directions_car' : 'local_shipping'}
              </span>
            </div>
            <div>
              <h3 className="font-black text-[18px] text-primary">{vehicle.manufacturer} {vehicle.model}</h3>
              <p className="text-[12px] text-on-surface-variant mt-1">
                Branch: <span className="font-semibold text-on-surface">{vehicle.branch_id}</span>
                {vehicle.manufacturing_year && ` • Year: ${vehicle.manufacturing_year}`}
              </p>
              <p className="text-[12px] text-on-surface-variant mt-0.5">Type: {vehicle.vehicle_type}</p>
            </div>
          </div>

          {/* Odometer */}
          <div className="bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm hover:shadow-md transition-all card-hover animate-fade-in-up">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Odometer</span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">speed</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-black text-[28px] text-primary leading-none">
                {(vehicle.current_mileage / 1000).toFixed(1)}k
              </span>
              <p className="text-[11px] text-on-surface-variant mt-1">{vehicle.current_mileage.toLocaleString()} mi total</p>
            </div>
          </div>

          {/* Total Spend */}
          <div className="bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm hover:shadow-md transition-all card-hover animate-fade-in-up">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Spent</span>
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-green-600" aria-hidden="true">payments</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-black text-[24px] text-primary leading-none">${totalSpend.toFixed(0)}</span>
              <p className="text-[11px] text-on-surface-variant mt-1">across {serviceRecords.length} service{serviceRecords.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </section>

        {/* Service History */}
        <div className="flex justify-between items-end mb-2 border-b border-outline-variant/40 pb-4 animate-fade-in-up">
          <div>
            <h3 className="font-bold text-[17px] text-primary">Service History</h3>
            <p className="text-[12px] text-on-surface-variant mt-0.5">Chronological log of maintenance on this asset.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert(`Exported maintenance sheet for ${vehicle.vehicle_number}`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/60 rounded-xl text-[12px] font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer btn-scale focus-ring"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">download</span>
              Export
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative pl-4 md:pl-8 space-y-4">
          {/* Vertical line */}
          {serviceRecords.length > 1 && (
            <div className="absolute left-[18px] md:left-[26px] top-5 bottom-5 w-0.5 bg-outline-variant/50 pointer-events-none" aria-hidden="true" />
          )}

          {serviceRecords.length > 0 ? (
            serviceRecords.map((record, idx) => {
              const isMajor = Number(record.total_cost) > 500;
              return (
                <div
                  key={record.id}
                  className="relative pl-12 group animate-fade-in-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-[10px] md:left-[18px] top-5 w-4 h-4 rounded-full border-[3px] border-white shadow-md z-10 group-hover:scale-125 transition-all duration-200 ${
                      isMajor ? 'bg-error' : 'bg-surface-tint'
                    }`}
                    aria-hidden="true"
                  />

                  <div className="bg-white border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all card-hover relative overflow-hidden">
                    {/* Left accent */}
                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${isMajor ? 'bg-error' : 'bg-primary'}`} aria-hidden="true" />

                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${isMajor ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'}`}>
                            {isMajor ? 'Major Repair' : 'Routine Maintenance'}
                          </span>
                          <span className="font-mono text-[11px] text-on-surface-variant">{record.service_date}</span>
                        </div>
                        <h4 className="font-bold text-[15px] text-primary">{record.service_type}</h4>
                        <p className="text-[12.5px] text-on-surface-variant mt-1 leading-relaxed">{record.description || 'No description provided.'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-black text-[22px] text-primary block">${Number(record.total_cost).toFixed(2)}</span>
                        <Link href={`/service-records/${record.id}`}>
                          <button className="mt-1.5 text-[12px] text-primary hover:underline font-semibold flex items-center gap-1 ml-auto cursor-pointer border-0 bg-transparent focus-ring rounded">
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">receipt_long</span>
                            View Details
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Metadata strip */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 bg-surface-container-low py-3 px-4 rounded-xl border border-outline-variant/30">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Odometer</span>
                        <span className="font-mono text-[13px] font-semibold text-on-surface">{record.current_mileage.toLocaleString()} mi</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Parts Changed</span>
                        <span className="text-[12px] text-on-surface truncate block" title={record.parts_changed}>{record.parts_changed || 'None'}</span>
                      </div>
                      {record.next_service_date && (
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Next Service</span>
                          <span className="text-[12px] text-on-surface font-semibold">{new Date(record.next_service_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-outline-variant/60 shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-outline-variant mb-3 block animate-float" aria-hidden="true">build</span>
              <h3 className="font-semibold text-[15px] text-on-surface mb-1">No Service Records Yet</h3>
              <p className="text-[12px] text-on-surface-variant mb-4">Start by creating the first service record for this vehicle.</p>
              <Link href="/service-records/create">
                <button className="text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer btn-scale border-0 shadow-md focus-ring" style={{ background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}>
                  Create Service Record
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
