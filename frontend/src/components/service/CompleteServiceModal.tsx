import React from 'react';
import { Wrench, CheckCircle, Calendar, Clock, FileText } from 'lucide-react';

export default function CompleteServiceModal({
  isPopupOpen,
  setIsPopupOpen,
  selectedVehicle,
  recentRecords,
  error,
  handleSubmit,
  formData,
  setFormData,
  submitting
}: any) {
  if (!isPopupOpen || !selectedVehicle) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#F8F6F0] rounded-[24px] shadow-2xl w-full max-w-[750px] max-h-[90vh] overflow-y-auto overflow-x-hidden animate-scale-in flex flex-col border border-[#E5E0D8]">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 relative">
          <button onClick={() => setIsPopupOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 border border-[#E5E0D8] p-2 rounded-full transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex items-start gap-4 mb-3">
            <div className="w-10 h-10 bg-[#E0E7FF] rounded-full flex items-center justify-center text-blue-600 shrink-0">
              <Wrench size={20} />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Complete Service</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-[500px]">Capture the latest service details and review the vehicle's maintenance history before you submit.</p>
            </div>
          </div>

          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 bg-blue-50/50 text-blue-700 text-[10px] font-extrabold rounded-full border border-blue-200 uppercase tracking-widest">
              NEW RECORD
            </span>
          </div>
        </div>

        <div className="px-8 pb-8 flex-1">
          {/* Recent Records Box */}
          <div className="border border-[#E5E0D8] rounded-xl overflow-hidden mb-8 bg-transparent">
            <div className="px-5 py-3 border-b border-[#E5E0D8] flex justify-between items-center bg-[#F1EFE7]/50">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Calendar size={14} className="text-slate-500" />
                {selectedVehicle.vehicle_number} - {selectedVehicle.model}
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{recentRecords.length} RECENT RECORDS</span>
            </div>

            <div className="divide-y divide-[#E5E0D8] max-h-[160px] overflow-y-auto">
              {recentRecords.length > 0 ? (
                recentRecords.map((record: any, idx: number) => (
                  <div key={idx} className="px-5 py-3 flex justify-between items-start hover:bg-white/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{record.service_type || 'General Service'}</p>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Clock size={12} /> {(record.current_mileage || record.mileage || 0).toLocaleString()} km</span>
                          {record.service_center_name && (
                            <span>• {record.service_center_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{new Date(record.service_date || Date.now()).toISOString().split('T')[0]}</span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-4 text-sm text-slate-500 text-center italic">No recent service history found for this vehicle.</div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-l-red-500 rounded-r-lg text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mb-2">Vehicle (required)</label>
              <select disabled className="w-full border border-[#E5E0D8] rounded-xl px-4 py-3 text-sm font-bold bg-transparent text-slate-700 outline-none appearance-none cursor-not-allowed">
                <option>{selectedVehicle.vehicle_number} - {selectedVehicle.model}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mb-2">Service Type (required)</label>
              <input type="text" required value={formData.service_type} onChange={e => setFormData({ ...formData, service_type: e.target.value })} className="w-full border border-[#E5E0D8] bg-transparent rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400" placeholder="Select service type" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mb-2">Service Date (required)</label>
                <input type="date" required value={formData.service_date} onChange={e => setFormData({ ...formData, service_date: e.target.value })} className="w-full border border-[#E5E0D8] bg-transparent rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mb-2">Odometer Reading (required)</label>
                <input type="number" required value={formData.current_mileage} onChange={e => setFormData({ ...formData, current_mileage: e.target.value })} className="w-full border border-[#E5E0D8] bg-transparent rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="--" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mb-2">Service Center</label>
                <input type="text" value={formData.service_center_name} onChange={e => setFormData({ ...formData, service_center_name: e.target.value })} className="w-full border border-[#E5E0D8] bg-transparent rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mb-2">Mechanic Name</label>
                <input type="text" value={formData.mechanic_name} onChange={e => setFormData({ ...formData, mechanic_name: e.target.value })} className="w-full border border-[#E5E0D8] bg-transparent rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mb-2">Work Performed</label>
                <textarea value={formData.work_performed} onChange={e => setFormData({ ...formData, work_performed: e.target.value })} className="w-full border border-[#E5E0D8] bg-transparent rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" rows={2} placeholder="Describe the maintenance performed..."></textarea>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mb-2">Total Cost ($)</label>
                <input type="number" step="0.01" value={formData.total_cost} onChange={e => setFormData({ ...formData, total_cost: e.target.value })} className="w-full border border-[#E5E0D8] bg-transparent rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mb-2">Next Service Date</label>
                <input type="date" value={formData.next_service_date} onChange={e => setFormData({ ...formData, next_service_date: e.target.value })} className="w-full border border-[#E5E0D8] bg-transparent rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mb-2">Next Service KM</label>
                <input type="number" value={formData.next_service_km} onChange={e => setFormData({ ...formData, next_service_km: e.target.value })} className="w-full border border-[#E5E0D8] bg-transparent rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="--" />
              </div>
            </div>

            <div className="mt-8 pt-6 flex justify-end gap-3 border-t border-[#E5E0D8]">
              <button type="button" onClick={() => setIsPopupOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-transparent border-0 hover:bg-[#E5E0D8]/50 rounded-xl transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-md border-0">
                <CheckCircle size={16} />
                {submitting ? 'Submitting...' : 'Submit Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
