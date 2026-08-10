'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';

export default function ServiceQueuePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchQueue();
  }, [router]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await api.vehicles.getAll();
      // Filter vehicles that need service or are in maintenance
      setVehicles(data.filter((v: any) => v.status === 'In Service' || v.status === 'Maintenance' || (v.current_mileage > 40000)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Service Queue</h2>
            <p className="text-slate-500 text-sm mt-1">Manage incoming maintenance requests and active jobs.</p>
          </div>
          <Link href="/service-records/create">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-blue-700 transition-colors cursor-pointer border-0">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Service Record
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Mileage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {v.vehicle_number} <span className="text-slate-400 font-normal">({v.manufacturer} {v.model})</span>
                    </td>
                    <td className="px-6 py-4 font-mono">{v.current_mileage?.toLocaleString()} mi</td>
                    <td className="px-6 py-4">
                      <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200">Pending Service</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/service-records/create?vehicleId=${v.id}`}>
                        <button 
                          className="bg-blue-600 text-white px-3.5 py-2 rounded-xl font-bold hover:bg-blue-700 text-xs shadow-sm transition-colors cursor-pointer border-0 inline-flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">add_task</span>
                          Add Service Record
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500">No vehicles in queue.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
