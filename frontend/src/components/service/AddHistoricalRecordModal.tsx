import React from 'react';
import { X, Calendar, Wrench, CheckCircle } from 'lucide-react';
import { Vehicle } from '@/types';

interface AddHistoricalRecordModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedVehicle: Vehicle | null;
  error: string;
  handleSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: any;
  submitting: boolean;
}

export default function AddHistoricalRecordModal({
  isOpen, setIsOpen, selectedVehicle, error, handleSubmit, formData, setFormData, submitting
}: AddHistoricalRecordModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-[500px] max-w-[90vw] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 shrink-0">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Add Historical Record</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.vehicle_number})
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="historical-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Service Type</label>
                <select
                  required
                  value={formData.service_type}
                  onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Service Type</option>
                  <option value="Oil Change">Oil Change</option>
                  <option value="General Service">General Service</option>
                  <option value="Engine Repair">Engine Repair</option>
                  <option value="Tyre Rotation">Tyre Rotation</option>
                  <option value="Battery Check">Battery Check</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={formData.service_date}
                    onChange={(e) => setFormData({...formData, service_date: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Mileage (km)</label>
                <input
                  type="number"
                  required
                  value={formData.current_mileage}
                  onChange={(e) => setFormData({...formData, current_mileage: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Service Center</label>
                <input
                  type="text"
                  value={formData.service_center_name}
                  onChange={(e) => setFormData({...formData, service_center_name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Cost (₹)</label>
                <input
                  type="number"
                  value={formData.total_cost}
                  onChange={(e) => setFormData({...formData, total_cost: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Notes / Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.work_performed}
                  onChange={(e) => setFormData({...formData, work_performed: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describe the work done..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Next Service Date</label>
                <input
                  type="date"
                  value={formData.next_service_date}
                  onChange={(e) => setFormData({...formData, next_service_date: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Next Service KM</label>
                <input
                  type="number"
                  value={formData.next_service_km}
                  onChange={(e) => setFormData({...formData, next_service_km: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shrink-0 z-10">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-5 py-2.5 text-sm font-extrabold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="historical-form"
            disabled={submitting}
            className="px-6 py-2.5 flex items-center gap-2 text-sm font-extrabold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <CheckCircle size={16} />
            {submitting ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
}
