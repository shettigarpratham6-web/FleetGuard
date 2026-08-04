'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, MaintenanceRisk } from '@/types';
import Footer from '@/components/Footer';

export default function MaintenanceQueuePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [risks, setRisks] = useState<MaintenanceRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = api.auth.getLocalUser();
    if (currentUser && currentUser.role === 'Driver') {
      router.push('/driver');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [vehiclesData, risksData] = await Promise.all([
          api.vehicles.getAll(),
          api.risks.getAll(),
        ]);
        setVehicles(vehiclesData || []);
        setRisks(risksData || []);
      } catch (err: any) {
        console.error('Error fetching maintenance queue details:', err);
        setError(err.message || 'Failed to load maintenance queue.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Helper to get risk details for a vehicle
  const getVehicleRisk = (vehicleId: string) => {
    return risks.find((r) => r.vehicle_id === vehicleId);
  };

  // Group vehicles into lanes based on risk level
  const overdueVehicles = vehicles.filter((v) => {
    const risk = getVehicleRisk(v.id);
    return risk?.risk_level === 'High' &&
      (v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const dueSoonVehicles = vehicles.filter((v) => {
    const risk = getVehicleRisk(v.id);
    return risk?.risk_level === 'Medium' &&
      (v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const upcomingVehicles = vehicles.filter((v) => {
    const risk = getVehicleRisk(v.id);
    // Include vehicles with Low risk or default available vehicles
    return (risk?.risk_level === 'Low' || (!risk && v.status !== 'Maintenance')) &&
      (v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body-md text-on-surface-variant">Loading maintenance queue lanes...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper
      searchPlaceholder="Search vehicle ID..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="p-lg md:p-margin-desktop space-y-xl max-w-[1400px] mx-auto">

        {/* Page Title */}
        <div className="flex justify-between items-center pb-sm border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-md text-headline-md font-semibold text-on-background">
              Maintenance Queue
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
              Monitor active repair lane queues, alerts, and schedules.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-md rounded-xl bg-error-container/10 border border-error-container/30 text-error text-body-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {/* Lanes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">

          {/* Overdue Lane */}
          <section className="space-y-md">
            <div className="flex items-center gap-sm mb-md pb-xs border-b border-outline-variant/30 py-sm">
              <span className="w-3 h-3 rounded-full bg-error"></span>
              <h3 className="font-headline-sm text-headline-sm text-on-background">Overdue</h3>
              <span className="bg-error/10 text-error font-label-md text-label-md px-2 py-0.5 rounded-full ml-xs">
                {overdueVehicles.length}
              </span>
            </div>

            <div className="space-y-md">
              {overdueVehicles.map((vehicle) => {
                const risk = getVehicleRisk(vehicle.id);
                return (
                  <div
                    key={vehicle.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] transition-shadow duration-200 group flex flex-col relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-error"></div>
                    <div className="flex justify-between items-start mb-md">
                      <div>
                        <div className="flex items-center gap-xs">
                          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Unit #</span>
                          <span className="font-headline-sm text-headline-sm font-bold text-on-background">{vehicle.vehicle_number}</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{vehicle.manufacturer} {vehicle.model}</p>
                      </div>
                      <span className="bg-error text-on-error font-label-md text-label-md px-sm py-xs rounded flex items-center gap-xs shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        Past Due
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-sm mb-lg flex-1">
                      <div className="bg-surface-container-low p-sm rounded-md">
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Current Mileage</p>
                        <p className="font-data-mono text-data-mono text-on-background">{vehicle.current_mileage.toLocaleString()} mi</p>
                      </div>
                      <div className="bg-error/5 p-sm rounded-md border border-error/20">
                        <p className="font-label-md text-label-md text-error mb-xs">Distance Over</p>
                        <p className="font-data-mono text-data-mono text-error font-bold">
                          +{Math.abs(risk?.remaining_distance || 0).toLocaleString()} mi
                        </p>
                      </div>
                      <div className="col-span-2 bg-surface-container-low p-sm rounded-md">
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Required Service</p>
                        <p className="font-body-sm text-body-sm text-on-background flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px] text-primary">oil_barrel</span>
                          {risk?.summary?.split('.')[0] || 'Full Synthetic Oil Change & Filter'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-md border-t border-outline-variant flex justify-between items-center">
                      <span className="font-body-sm text-body-sm text-error flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        Due: Oct 12, 2023
                      </span>
                      <Link href={`/vehicles/${vehicle.id}`}>
                        <button className="bg-primary-container text-on-primary-container hover:bg-surface-tint hover:text-white transition-colors font-label-md text-label-md py-xs px-md rounded border border-transparent cursor-pointer">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
              {overdueVehicles.length === 0 && (
                <div className="p-md text-center bg-surface-container-lowest border border-outline-variant text-on-surface-variant rounded-lg font-body-sm">
                  No vehicles in overdue queue.
                </div>
              )}
            </div>
          </section>

          {/* Due Soon Lane */}
          <section className="space-y-md">
            <div className="flex items-center gap-sm mb-md pb-xs border-b border-outline-variant/30 py-sm">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span>
              <h3 className="font-headline-sm text-headline-sm text-on-background">Due Soon</h3>
              <span className="bg-[#f59e0b]/10 text-[#d97706] font-label-md text-label-md px-2 py-0.5 rounded-full ml-xs">
                {dueSoonVehicles.length}
              </span>
            </div>

            <div className="space-y-md">
              {dueSoonVehicles.map((vehicle) => {
                const risk = getVehicleRisk(vehicle.id);
                return (
                  <div
                    key={vehicle.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] transition-shadow duration-200 group flex flex-col relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#f59e0b]"></div>
                    <div className="flex justify-between items-start mb-md">
                      <div>
                        <div className="flex items-center gap-xs">
                          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Unit #</span>
                          <span className="font-headline-sm text-headline-sm font-bold text-on-background">{vehicle.vehicle_number}</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{vehicle.manufacturer} {vehicle.model}</p>
                      </div>
                      <span className="bg-[#f59e0b]/10 text-[#d97706] font-label-md text-label-md px-sm py-xs rounded flex items-center gap-xs border border-[#f59e0b]/20 shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        Imminent
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-sm mb-lg flex-1">
                      <div className="bg-surface-container-low p-sm rounded-md">
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Current Mileage</p>
                        <p className="font-data-mono text-data-mono text-on-background">{vehicle.current_mileage.toLocaleString()} mi</p>
                      </div>
                      <div className="bg-[#f59e0b]/5 p-sm rounded-md border border-[#f59e0b]/20">
                        <p className="font-label-md text-label-md text-[#d97706] mb-xs">Distance Rem.</p>
                        <p className="font-data-mono text-data-mono text-[#d97706] font-bold">
                          {risk?.remaining_distance.toLocaleString()} mi
                        </p>
                      </div>
                      <div className="col-span-2 bg-surface-container-low p-sm rounded-md">
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Required Service</p>
                        <p className="font-body-sm text-body-sm text-on-background flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px] text-primary">minor_crash</span>
                          {risk?.summary?.split('.')[0] || 'Brake Pad Replacement'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-md border-t border-outline-variant flex justify-between items-center">
                      <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        Est: Oct 18, 2023
                      </span>
                      <Link href={`/vehicles/${vehicle.id}`}>
                        <button className="bg-surface-container-low text-on-background border border-outline-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md py-xs px-md rounded cursor-pointer">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
              {dueSoonVehicles.length === 0 && (
                <div className="p-md text-center bg-surface-container-lowest border border-outline-variant text-on-surface-variant rounded-lg font-body-sm">
                  No vehicles in due soon queue.
                </div>
              )}
            </div>
          </section>

          {/* Upcoming Lane */}
          <section className="space-y-md">
            <div className="flex items-center gap-sm mb-md pb-xs border-b border-outline-variant/30 py-sm">
              <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
              <h3 className="font-headline-sm text-headline-sm text-on-background">Upcoming</h3>
              <span className="bg-[#10b981]/10 text-[#047857] font-label-md text-label-md px-2 py-0.5 rounded-full ml-xs">
                {upcomingVehicles.length}
              </span>
            </div>

            <div className="space-y-md">
              {upcomingVehicles.map((vehicle) => {
                const risk = getVehicleRisk(vehicle.id);
                return (
                  <div
                    key={vehicle.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] transition-shadow duration-200 group flex flex-col relative overflow-hidden opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#10b981]/50"></div>
                    <div className="flex justify-between items-start mb-md">
                      <div>
                        <div className="flex items-center gap-xs">
                          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Unit #</span>
                          <span className="font-headline-sm text-headline-sm font-bold text-on-background">{vehicle.vehicle_number}</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{vehicle.manufacturer} {vehicle.model}</p>
                      </div>
                      <span className="text-[#047857] font-label-md text-label-md px-sm py-xs flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Scheduled
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-sm mb-lg flex-1">
                      <div className="bg-surface-container-low p-sm rounded-md">
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Current Mileage</p>
                        <p className="font-data-mono text-data-mono text-on-background">{vehicle.current_mileage.toLocaleString()} mi</p>
                      </div>
                      <div className="bg-surface-container-low p-sm rounded-md">
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Distance Rem.</p>
                        <p className="font-data-mono text-data-mono text-on-background">
                          {risk ? `${risk.remaining_distance.toLocaleString()} mi` : '5,000+ mi'}
                        </p>
                      </div>
                      <div className="col-span-2 bg-surface-container-low p-sm rounded-md">
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Required Service</p>
                        <p className="font-body-sm text-body-sm text-on-background flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px] text-primary">ac_unit</span>
                          {risk?.summary?.split('.')[0] || 'HVAC System Inspection'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-md border-t border-outline-variant flex justify-between items-center">
                      <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        Est: Nov 05, 2023
                      </span>
                      <Link href={`/vehicles/${vehicle.id}`}>
                        <button className="bg-surface-container-low text-on-background border border-outline-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md py-xs px-md rounded cursor-pointer">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
              {upcomingVehicles.length === 0 && (
                <div className="p-md text-center bg-surface-container-lowest border border-outline-variant text-on-surface-variant rounded-lg font-body-sm">
                  No upcoming scheduled maintenance.
                </div>
              )}
            </div>
          </section>

        </div>
        <div><Footer /></div>
      </div>
    </LayoutWrapper>
  );
}
