'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Wrench, Clock, CheckCircle2 } from 'lucide-react';
import HistoryCard from '@/components/service/HistoryCard';

export default function HistoricalRecordsPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch vehicles and both types of service records
        const [vehiclesData, historicalData, liveData] = await Promise.all([
          api.vehicles.getAll(),
          api.historicalServices.getAll().catch(() => ({ records: [] })),
          api.services.getAll().catch(() => [])
        ]);
        
        if (vehiclesData && Array.isArray(vehiclesData)) {
          setVehicles(vehiclesData);
          if (vehiclesData.length > 0) {
            setSelectedVehicleId(vehiclesData[0].id);
          }
        }
        
        // Combine historical records and live service records
        let allRecords: any[] = [];
        if (historicalData && Array.isArray(historicalData)) allRecords = [...allRecords, ...historicalData];
        else if (historicalData?.records) allRecords = [...allRecords, ...historicalData.records];

        if (liveData && Array.isArray(liveData)) allRecords = [...allRecords, ...liveData];
        else if ((liveData as any)?.records) allRecords = [...allRecords, ...(liveData as any).records];

        setRecords(allRecords);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err?.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const filteredRecords = records.filter((record) => {
    if (selectedVehicleId && record.vehicle_id !== selectedVehicleId) {
      return false;
    }
    const query = searchQuery.toLowerCase();
    return (
      (record.description || record.service_type || '').toLowerCase().includes(query) ||
      (record.remarks || record.notes || record.work_performed || '').toLowerCase().includes(query)
    );
  }).sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen text-slate-900">
        
        {/* Header Section */}
        <div className="pb-6 border-b border-slate-200">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Service History</h1>
          <p className="text-sm font-medium text-slate-500">
            Track and manage all historical and actively completed maintenance data across the fleet.
          </p>
        </div>

        <div className="flex flex-col gap-8 flex-1">
          {/* Top Controls: Vehicle Selector & Search */}
          <div className="flex flex-col md:flex-row gap-6 bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Select Vehicle</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => {
                  setSelectedVehicleId(e.target.value);
                  setExpandedRecordId(null);
                }}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="">All Vehicles</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.vehicle_number} — {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Search Records</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search by keyword, type, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Service History Timeline Card */}
          {selectedVehicleId && selectedVehicle ? (
            <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden flex-1 flex flex-col shadow-sm">
              <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm shrink-0">
                    <Wrench size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">Service History Timeline</h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.vehicle_number})</p>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-white border border-slate-200 text-blue-700 text-[11px] font-black rounded-lg tracking-widest uppercase shadow-sm whitespace-nowrap">
                  {filteredRecords.length} Records
                </div>
              </div>

              <div className="p-8 md:p-12 relative flex-1 bg-white">
                {filteredRecords.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
                    {filteredRecords.map((record, index) => {
                      const isLatest = index === 0;
                      const isExpanded = expandedRecordId === (record.id || index.toString());
                      return (
                        <HistoryCard 
                          key={record.id || index}
                          record={record}
                          index={index}
                          isLatest={isLatest}
                          isExpanded={isExpanded}
                          toggleExpand={() => setExpandedRecordId(isExpanded ? null : (record.id || index.toString()))}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock size={36} className="text-slate-400" />
                    </div>
                    <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">No History Found</h4>
                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm mx-auto">There are no service records available for this vehicle yet. Once a service is completed, it will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] border border-slate-200 flex-1 flex flex-col items-center justify-center py-24 shadow-sm">
              <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Wrench size={48} className="text-blue-200" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Select a Vehicle</h3>
              <p className="text-sm font-medium text-slate-500 mt-3 max-w-md text-center">Choose a vehicle from the dropdown above to view its complete service history timeline.</p>
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}