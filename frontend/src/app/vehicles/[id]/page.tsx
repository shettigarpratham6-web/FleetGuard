'use client';
import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { db } from '@/data/mockDb';

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const vehicle = db.getVehicle(id) || db.getVehicles()[0]; // fallback to first vehicle
  const serviceRecords = db.getServiceRecords().filter((sr) => sr.vehicle_id === vehicle.id);
  const risks = db.getMaintenanceRisks().find((r) => r.vehicle_id === vehicle.id);

  // Compute status color classes
  const statusColorClass =
    vehicle.status === 'Maintenance'
      ? 'bg-error-container text-on-error-container'
      : vehicle.status === 'Assigned'
        ? 'bg-primary-container text-on-primary-container'
        : 'bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20';

  return (
    <LayoutWrapper searchPlaceholder="Search services for this vehicle...">
      <div className="p-margin-mobile md:p-margin-desktop flex-1 max-w-7xl mx-auto w-full space-y-lg">
        {/* Sticky Header (Context) */}
        <div className="pb-sm border-b border-outline-variant flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs font-body-md text-body-md cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
        </div>

        {/* Title area */}
        <div className="flex justify-between items-center">
          <div>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Vehicle Details
            </span>
            <h2 className="font-display-lg text-display-lg text-primary mt-xs">
              Asset {vehicle.vehicle_number}
            </h2>
          </div>
        </div>

        {/* Vehicle Stats Summary (Bento Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
          {/* Main Info Card (Spans 2 columns) */}
          <div className="md:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex gap-lg items-center relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="w-24 h-24 rounded-lg bg-surface-container-high flex-shrink-0 border border-outline-variant flex items-center justify-center text-primary-container text-[48px]">
              <span className="material-symbols-outlined text-[48px]">
                {vehicle.vehicle_type === 'Light Van' ? 'directions_car' : 'local_shipping'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-sm mb-xs">
                <span className={`font-label-md text-[10px] px-2 py-0.5 rounded uppercase font-bold ${statusColorClass}`}>
                  {vehicle.status}
                </span>
                <span className="font-data-mono text-data-mono text-on-surface-variant">
                  VIN: {vehicle.registration_number}
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">
                {vehicle.manufacturer} {vehicle.model}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Branch ID: {vehicle.branch_id} • Year: {vehicle.manufacturing_year || 'N/A'}
              </p>
            </div>
          </div>

          {/* Odometer Stat */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Odometer</span>
              <span className="material-symbols-outlined text-primary">speed</span>
            </div>
            <div className="mt-4">
              <span className="font-display-lg text-display-lg text-primary">
                {(vehicle.current_mileage / 1000).toFixed(0)}k
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant ml-1">
                ({vehicle.current_mileage.toLocaleString()} mi)
              </span>
            </div>
          </div>

          {/* Health Score Stat */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start z-10">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Health Score</span>
              <span className="material-symbols-outlined text-[#28a094]">health_and_safety</span>
            </div>
            <div className="mt-4 z-10">
              <span className="font-display-lg text-display-lg text-primary">
                {risks?.risk_level === 'High' ? '68' : risks?.risk_level === 'Medium' ? '82' : '96'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant ml-1">/100</span>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-tertiary-fixed-dim/20 rounded-full blur-xl z-0"></div>
          </div>
        </section>

        {/* Service Timeline Header */}
        <div className="flex justify-between items-end mb-lg border-b border-outline-variant pb-sm">
          <div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">Service History</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Chronological log of maintenance performed on this asset.
            </p>
          </div>
          <div className="flex gap-sm">
            <button className="px-md py-sm bg-surface border border-outline-variant rounded-md font-label-md text-label-md text-primary flex items-center gap-xs hover:bg-surface-container-high transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
            </button>
            <button
              onClick={() => alert(`Exported maintenance sheet for asset ${vehicle.vehicle_number}`)}
              className="px-md py-sm bg-primary-container text-on-primary-container rounded-md font-label-md text-label-md flex items-center gap-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span> Export Log
            </button>
          </div>
        </div>

        {/* Vertical Timeline */}
        <div className="relative pl-sm md:pl-lg py-sm space-y-lg">
          {/* Vertical Connecting Line */}
          {serviceRecords.length > 1 && (
            <div className="absolute left-[20px] md:left-[28px] top-6 bottom-6 w-0.5 bg-outline-variant pointer-events-none z-0"></div>
          )}

          {serviceRecords.length > 0 ? (
            serviceRecords.map((record) => {
              const isMajor = record.total_cost > 500;
              const nodeColor = isMajor ? 'bg-error' : 'bg-tertiary-container';
              const bannerColorClass = isMajor ? 'bg-error' : 'bg-primary-container';
              const labelColorClass = isMajor ? 'text-error bg-error-container' : 'text-on-tertiary-container bg-tertiary-container';

              return (
                <div key={record.id} className="relative pl-[48px] group z-10">
                  {/* Node dot */}
                  <div className={`absolute left-[12px] md:left-[20px] top-6 w-4 h-4 rounded-full ${nodeColor} border-4 border-surface-bright z-10 shadow-sm group-hover:scale-125 transition-all`} />

                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${bannerColorClass}`}></div>

                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-md mb-md">
                      <div>
                        <div className="flex items-center gap-sm mb-1">
                          <span className={`font-label-md text-label-md uppercase px-2 py-0.5 rounded ${labelColorClass}`}>
                            {isMajor ? 'Major Repair' : 'Routine Maintenance'}
                          </span>
                          <span className="font-data-mono text-data-mono text-on-surface-variant">
                            {record.service_date}
                          </span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm text-primary font-bold">
                          {record.service_type}
                        </h4>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
                          {record.description}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="font-headline-sm text-headline-sm font-data-mono text-primary block">
                          ${record.total_cost.toFixed(2)}
                        </span>
                        <Link href={`/service-records/${record.id}`}>
                          <button className="mt-2 text-primary hover:underline font-label-md text-label-md flex items-center gap-xs ml-auto transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                            View Details
                          </button>
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md bg-surface-container py-md px-lg rounded-lg border border-outline-variant/50">
                      <div>
                        <span className="font-label-md text-label-md text-on-surface-variant block mb-1 uppercase text-[10px]">
                          ODOMETER RECORDED
                        </span>
                        <span className="font-data-mono text-data-mono text-on-surface">
                          {record.current_mileage.toLocaleString()} mi
                        </span>
                      </div>
                      <div>
                        <span className="font-label-md text-label-md text-on-surface-variant block mb-1 uppercase text-[10px]">
                          Parts Replaced
                        </span>
                        <span className="font-body-md text-body-md text-on-surface truncate block" title={record.parts_changed}>
                          {record.parts_changed || 'None'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-lg bg-surface-container-lowest rounded-xl border border-outline-variant text-center text-on-surface-variant">
              No service records found for this asset.
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
