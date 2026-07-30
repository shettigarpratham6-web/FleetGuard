'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, ServiceRecord, User } from '@/types';

export default function ServiceRecordsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [mechanicFilter, setMechanicFilter] = useState('');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [vehiclesData, serviceRecordsData, usersData] = await Promise.all([
          api.vehicles.getAll(),
          api.services.getAll(),
          api.auth.getUsers(),
        ]);
        setVehicles(vehiclesData || []);
        setServiceRecords(serviceRecordsData || []);
        setUsers(usersData || []);
      } catch (err: any) {
        console.error('Error fetching records:', err);
        setError(err.message || 'Failed to retrieve records from backend.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Filters logic
  const filteredRecords = serviceRecords.filter((record) => {
    const vehicle = vehicles.find((v) => v.id === record.vehicle_id);

    // Global Search Matches
    const matchesSearch =
      searchQuery === '' ||
      record.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle?.vehicle_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle?.model || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Category Selector Filters
    const matchesVehicle = vehicleFilter === '' || record.vehicle_id === vehicleFilter;
    const matchesType =
      typeFilter === '' ||
      record.service_type.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesMechanic = mechanicFilter === '' || record.mechanic_id === mechanicFilter;

    return matchesSearch && matchesVehicle && matchesType && matchesMechanic;
  });

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body-md text-on-surface-variant">Connecting to service database...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper
      searchPlaceholder="Search records, VIN, notes..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="p-margin-mobile md:p-margin-desktop flex flex-col gap-lg max-w-[1600px] mx-auto w-full">
        {/* Title Header */}
        <div className="flex justify-between items-center pb-md border-b border-outline-variant/30">
          <div>
            <h2 className="font-display-lg text-display-lg text-primary">Service Records</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
              Comprehensive log of fleet maintenance and repairs.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-md rounded-xl bg-error-container/10 border border-error-container/30 text-error text-body-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {/* Controls Toolbar: Filters & Actions */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col xl:flex-row gap-md items-start xl:items-center justify-between">
          <div className="flex flex-col sm:flex-row flex-wrap gap-md w-full xl:w-auto">
            {/* Search Input (In toolbar too) */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none font-body-md text-body-md placeholder:text-on-surface-variant"
                placeholder="Search records, VIN..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Selects */}
            <div className="flex flex-wrap gap-sm w-full sm:w-auto">
              <select
                className="py-2 pl-3 pr-8 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-body-sm font-body-md text-on-surface outline-none cursor-pointer min-w-[140px]"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} ({v.model})
                  </option>
                ))}
              </select>

              <select
                className="py-2 pl-3 pr-8 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-body-sm font-body-md text-on-surface outline-none cursor-pointer min-w-[130px]"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Brake">Brake Pads & Rotors</option>
                <option value="Oil">Oil & Filters</option>
                <option value="Transmission">Transmission</option>
              </select>

              <select
                className="py-2 pl-3 pr-8 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-body-sm font-body-md text-on-surface outline-none cursor-pointer min-w-[140px]"
                value={mechanicFilter}
                onChange={(e) => setMechanicFilter(e.target.value)}
              >
                <option value="">All Mechanics</option>
                {users
                  .filter((u) => u.role === 'Service Center' || u.role === 'Driver')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-sm w-full xl:w-auto justify-end shrink-0">
            <button
              onClick={() => alert('Exporting record spreadsheet...')}
              className="p-2 bg-surface rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer border-none"
              title="Download Report"
            >
              <span className="material-symbols-outlined text-md">download</span>
            </button>
            <Link href="/service-records/create">
              <button className="bg-primary hover:opacity-95 text-on-primary font-label-md text-label-md py-2 px-md rounded-lg flex items-center justify-center gap-xs transition-colors shadow-sm whitespace-nowrap cursor-pointer active:opacity-80 border-none">
                <span className="material-symbols-outlined text-sm">add</span>
                Create Service Record
              </button>
            </Link>
          </div>
        </div>

        {/* Data Density Table Area */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-20">
                <tr>
                  <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-[15%]">
                    Vehicle #
                  </th>
                  <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-[15%]">
                    Date
                  </th>
                  <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right w-[12%]">
                    Mileage
                  </th>
                  <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-[20%]">
                    Service Type
                  </th>
                  <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-[18%]">
                    Mechanic/Shop
                  </th>
                  <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right w-[10%]">
                    Cost
                  </th>
                  <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-[10%]">
                    Status
                  </th>
                  <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right w-[10%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 font-data-mono text-data-mono bg-surface-container-lowest">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const vehicle = vehicles.find((v) => v.id === record.vehicle_id);
                    const mechanic = users.find((u) => u.id === record.mechanic_id);
                    const isCompleted = true; // For database-backed systems

                    return (
                      <tr key={record.id} className="hover:bg-surface/50 transition-colors group">
                        <td className="py-3 px-4">
                          <Link href={`/vehicles/${vehicle?.id}`} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant">
                              <span className="material-symbols-outlined text-sm text-on-surface-variant">
                                {vehicle?.vehicle_type === 'Light Van'
                                  ? 'directions_car'
                                  : 'local_shipping'}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-primary hover:underline">
                                {vehicle?.vehicle_number}
                              </span>
                              <span className="text-xs text-on-surface-variant font-body-sm">
                                {vehicle?.manufacturer} {vehicle?.model}
                              </span>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-on-surface whitespace-nowrap">
                          {new Date(record.service_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-on-surface text-right whitespace-nowrap">
                          {record.current_mileage.toLocaleString()} mi
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <Link href={`/service-records/${record.id}`} className="text-on-surface font-semibold hover:underline">
                              {record.service_type}
                            </Link>
                            <span className="text-xs text-on-surface-variant truncate max-w-[200px]" title={record.description}>
                              {record.description}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-on-surface">
                          {mechanic?.full_name || 'N/A'}
                          <br />
                          <span className="text-xs text-on-surface-variant font-body-sm capitalize">
                            {mechanic?.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-on-surface text-right font-medium">
                          ${Number(record.total_cost).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-label-md border bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                            Completed
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/service-records/${record.id}`}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
                              title="View Details"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                visibility
                              </span>
                            </Link>
                            <button
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer border-none bg-transparent"
                              title="Edit Record"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-lg text-center text-on-surface-variant">
                      No service records match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-surface border-t border-outline-variant p-sm flex items-center justify-between mt-auto">
            <span className="text-body-sm font-body-sm text-on-surface-variant pl-2">
              Showing {filteredRecords.length} of {serviceRecords.length} records
            </span>
            <div className="flex items-center gap-xs">
              <button
                className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50 border-none bg-transparent"
                disabled
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <div className="flex gap-1">
                <button className="w-7 h-7 rounded bg-primary-container text-on-primary-container font-label-md text-label-md flex items-center justify-center border-none">
                  1
                </button>
              </div>
              <button
                className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50 border-none bg-transparent"
                disabled
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
