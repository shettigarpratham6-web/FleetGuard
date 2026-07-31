'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, ServiceRecord, User } from '@/types';
import Footer from '@/components/footer';

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

  const filteredRecords = serviceRecords.filter((record) => {
    const vehicle = vehicles.find((v) => v.id === record.vehicle_id);
    const matchesSearch =
      searchQuery === '' ||
      record.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle?.vehicle_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle?.model || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVehicle = vehicleFilter === '' || record.vehicle_id === vehicleFilter;
    const matchesType = typeFilter === '' || record.service_type.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesMechanic = mechanicFilter === '' || record.mechanic_id === mechanicFilter;
    return matchesSearch && matchesVehicle && matchesType && matchesMechanic;
  });

  const hasActiveFilters = searchQuery || vehicleFilter || typeFilter || mechanicFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setVehicleFilter('');
    setTypeFilter('');
    setMechanicFilter('');
  };

  // ── LOADING STATE ─────────────────────────────────────────
  if (loading) {
    return (
      <LayoutWrapper>
        <div className="p-lg md:p-margin-desktop space-y-lg max-w-[1600px] mx-auto">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <div className="skeleton h-8 w-44 rounded-lg" />
              <div className="skeleton h-4 w-64 rounded" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-outline-variant/60 p-4 shadow-sm flex gap-3">
            {[200, 160, 140, 140].map((w, i) => (
              <div key={i} className="skeleton h-9 rounded-xl" style={{ width: w }} />
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant/40">
              <div className="skeleton h-4 w-32 rounded" />
            </div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-outline-variant/30">
                <div className="skeleton h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-2 w-20 rounded" />
                </div>
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
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
      <div className="p-lg md:p-margin-desktop flex flex-col gap-lg max-w-[1600px] mx-auto w-full">

        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-outline-variant/40 animate-fade-in-up">
          <div>
            <h2 className="font-black text-[26px] md:text-[30px] text-primary leading-tight">Service Records</h2>
            <p className="text-[13px] text-on-surface-variant mt-1">
              Comprehensive log of fleet maintenance and repairs.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[13px] text-on-surface-variant font-medium">
              {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-error-container/10 border border-error/20 text-error text-[13px] flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white border border-outline-variant/60 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between animate-fade-in-up">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[17px]" aria-hidden="true">search</span>
              <input
                className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-none text-[13px] text-on-surface placeholder:text-on-surface-variant/60"
                placeholder="Search records, VIN..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search service records"
              />
            </div>

            {/* Filter selects */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select
                className="py-2.5 pl-3 pr-8 bg-surface-container-low rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15 text-[12.5px] text-on-surface outline-none cursor-pointer min-w-[140px] transition-all"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                aria-label="Filter by vehicle"
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.vehicle_number} ({v.model})</option>
                ))}
              </select>

              <select
                className="py-2.5 pl-3 pr-8 bg-surface-container-low rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15 text-[12.5px] text-on-surface outline-none cursor-pointer min-w-[130px] transition-all"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by service type"
              >
                <option value="">All Types</option>
                <option value="Brake">Brake Pads & Rotors</option>
                <option value="Oil">Oil & Filters</option>
                <option value="Transmission">Transmission</option>
                <option value="Routine">Routine Maintenance</option>
                <option value="Emergency">Emergency Repair</option>
                <option value="Inspection">Inspection</option>
              </select>

              <select
                className="py-2.5 pl-3 pr-8 bg-surface-container-low rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15 text-[12.5px] text-on-surface outline-none cursor-pointer min-w-[140px] transition-all"
                value={mechanicFilter}
                onChange={(e) => setMechanicFilter(e.target.value)}
                aria-label="Filter by mechanic"
              >
                <option value="">All Mechanics</option>
                {users
                  .filter((u) => u.role === 'Service Center' || u.role === 'Driver')
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="py-2.5 px-3 bg-error-container/20 text-error rounded-xl border border-error/20 text-[12px] font-semibold hover:bg-error-container/40 transition-colors cursor-pointer flex items-center gap-1 focus-ring btn-scale border-0"
                  aria-label="Clear all filters"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">filter_alt_off</span>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-2 w-full xl:w-auto justify-end flex-shrink-0">
            <button
              onClick={() => {
                const data = filteredRecords.map(r => {
                  const v = vehicles.find(v => v.id === r.vehicle_id);
                  return `${v?.vehicle_number || ''},${r.service_type},${r.service_date},$${r.total_cost}`;
                }).join('\n');
                const blob = new Blob([`Vehicle,Type,Date,Cost\n${data}`], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'service-records.csv'; a.click();
              }}
              className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/60 text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer btn-scale focus-ring"
              title="Export as CSV"
              aria-label="Export records as CSV"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
            </button>
            <Link href="/service-records/create">
              <button className="text-white font-semibold text-[13px] py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer btn-scale border-0 focus-ring whitespace-nowrap hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}>
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">add</span>
                Create Service Record
              </button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table" aria-label="Service records">
              <thead className="bg-surface-container-low border-b border-outline-variant/40 sticky top-0 z-10">
                <tr>
                  {['Vehicle #', 'Date', 'Mileage', 'Service Type', 'Mechanic/Shop', 'Cost', 'Status', 'Actions'].map((col, i) => (
                    <th
                      key={col}
                      className={`py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ${i === 2 || i === 5 ? 'text-right' : ''} ${i === 7 ? 'text-right' : ''}`}
                      scope="col"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, idx) => {
                    const vehicle = vehicles.find((v) => v.id === record.vehicle_id);
                    const mechanic = users.find((u) => u.id === record.mechanic_id);
                    return (
                      <tr
                        key={record.id}
                        className={`hover:bg-primary-fixed/10 transition-colors group cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-surface-container-low/30'}`}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        {/* Vehicle */}
                        <td className="py-3.5 px-4">
                          <Link href={`/vehicles/${vehicle?.id}`} className="flex items-center gap-2.5" aria-label={`Vehicle ${vehicle?.vehicle_number}`}>
                            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/40 flex-shrink-0 group-hover:bg-primary-fixed transition-colors">
                              <span className="material-symbols-outlined text-[15px] text-on-surface-variant" aria-hidden="true">
                                {vehicle?.vehicle_type === 'Light Van' ? 'directions_car' : 'local_shipping'}
                              </span>
                            </div>
                            <div>
                              <span className="font-mono font-bold text-[13px] text-primary hover:underline block leading-none">{vehicle?.vehicle_number || 'N/A'}</span>
                              <span className="text-[11px] text-on-surface-variant">{vehicle?.manufacturer} {vehicle?.model}</span>
                            </div>
                          </Link>
                        </td>
                        {/* Date */}
                        <td className="py-3.5 px-4 text-[13px] text-on-surface whitespace-nowrap">
                          {new Date(record.service_date).toLocaleDateString()}
                        </td>
                        {/* Mileage */}
                        <td className="py-3.5 px-4 font-mono text-[13px] text-on-surface text-right whitespace-nowrap">
                          {record.current_mileage.toLocaleString()} mi
                        </td>
                        {/* Service Type */}
                        <td className="py-3.5 px-4">
                          <Link href={`/service-records/${record.id}`} className="hover:underline">
                            <span className="font-semibold text-[13px] text-on-surface block">{record.service_type}</span>
                          </Link>
                          {record.description && (
                            <span className="text-[11px] text-on-surface-variant truncate max-w-[180px] block" title={record.description}>
                              {record.description}
                            </span>
                          )}
                        </td>
                        {/* Mechanic */}
                        <td className="py-3.5 px-4">
                          <span className="text-[13px] text-on-surface block">{mechanic?.full_name || '—'}</span>
                          <span className="text-[11px] text-on-surface-variant capitalize">{mechanic?.role}</span>
                        </td>
                        {/* Cost */}
                        <td className="py-3.5 px-4 font-mono font-bold text-[13px] text-on-surface text-right whitespace-nowrap">
                          ${Number(record.total_cost).toFixed(2)}
                        </td>
                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
                            Completed
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/service-records/${record.id}`}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors focus-ring"
                              title="View Details"
                              aria-label="View service record details"
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">visibility</span>
                            </Link>
                            <Link
                              href={`/service-records/${record.id}`}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors focus-ring"
                              title="Edit Record"
                              aria-label="Edit service record"
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <span className="material-symbols-outlined text-[48px] text-outline-variant mb-3 block animate-float" aria-hidden="true">
                        {hasActiveFilters ? 'search_off' : 'description'}
                      </span>
                      <h3 className="font-semibold text-[15px] text-on-surface mb-1">
                        {hasActiveFilters ? 'No records match your filters' : 'No service records yet'}
                      </h3>
                      <p className="text-[12px] text-on-surface-variant mb-4">
                        {hasActiveFilters ? 'Try adjusting or clearing filters.' : 'Create your first service record to get started.'}
                      </p>
                      {hasActiveFilters ? (
                        <button onClick={clearFilters} className="text-[13px] text-primary font-semibold hover:underline focus-ring cursor-pointer border-0 bg-transparent">
                          Clear all filters
                        </button>
                      ) : (
                        <Link href="/service-records/create">
                          <button className="text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer btn-scale border-0 shadow-md focus-ring" style={{ background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}>
                            Create Service Record
                          </button>
                        </Link>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-surface-container-low/50 border-t border-outline-variant/40 px-4 py-3 flex items-center justify-between mt-auto">
            <span className="text-[12px] text-on-surface-variant">
              Showing <strong>{filteredRecords.length}</strong> of <strong>{serviceRecords.length}</strong> records
              {hasActiveFilters && <span className="text-primary"> (filtered)</span>}
            </span>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 border-0 bg-transparent cursor-not-allowed" disabled aria-label="Previous page">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>
              </button>
              <button className="w-7 h-7 rounded-lg bg-primary text-white text-[12px] font-bold flex items-center justify-center border-0" aria-current="page">1</button>
              <button className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 border-0 bg-transparent cursor-not-allowed" disabled aria-label="Next page">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        <div><Footer /></div>
      </div>
    </LayoutWrapper>
  );
}
