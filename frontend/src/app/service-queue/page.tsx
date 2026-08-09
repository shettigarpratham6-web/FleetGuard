'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';

export default function ServiceQueuePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [serviceType, setServiceType] = useState('General Maintenance');
  const [cost, setCost] = useState('');
  const [parts, setParts] = useState('');
  const [remarks, setRemarks] = useState('');

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
      // Mock filtering for vehicles that need service
      setVehicles(data.filter((v: any) => v.status === 'In Service' || (v.current_mileage > 40000)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      // Create service record and update vehicle status back to Available
      await api.services.create({
        vehicle_id: selectedVehicle.id,
        service_type: serviceType,
        service_date: new Date().toISOString().split('T')[0],
        current_mileage: selectedVehicle.current_mileage || 0,
        labour_cost: Number(cost) || 0,
        parts_cost: 0,
        parts_changed: parts,
        description: remarks,
        next_service_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      await api.vehicles.update(selectedVehicle.id, { status: 'Available' });
      setIsModalOpen(false);
      fetchQueue();
    } catch (err: any) {
      console.error('Error completing service:', err);
      alert(err.message || "Failed to complete service");
    }
  };

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Service Queue</h2>
          <p className="text-slate-500 text-sm mt-1">Manage incoming maintenance requests and active jobs.</p>
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
                    <td className="px-6 py-4 font-bold text-slate-900">{v.vehicle_number}</td>
                    <td className="px-6 py-4 font-mono">{v.current_mileage?.toLocaleString()} mi</td>
                    <td className="px-6 py-4">
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">Pending Service</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { setSelectedVehicle(v); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 text-xs shadow-sm transition-colors"
                      >
                        Complete Service
                      </button>
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

        {/* Complete Service Modal */}
        {isModalOpen && selectedVehicle && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-extrabold text-slate-900">Complete Service: {selectedVehicle.vehicle_number}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleCompleteService} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Type</label>
                  <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-semibold bg-slate-50">
                    <option>General Maintenance</option>
                    <option>Engine Repair</option>
                    <option>Brake Replacement</option>
                    <option>Tire Rotation</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cost ($)</label>
                    <input type="number" required value={cost} onChange={(e) => setCost(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-semibold bg-slate-50" placeholder="e.g. 450" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parts Changed</label>
                    <input type="text" value={parts} onChange={(e) => setParts(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-semibold bg-slate-50" placeholder="e.g. Brake pads" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Remarks</label>
                  <textarea required value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-semibold bg-slate-50" placeholder="Notes on service..."></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm">Submit Record</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
