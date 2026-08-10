import React from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock, MapPin, User, FileText, DollarSign } from 'lucide-react';

export default function HistoryCard({ record, index, isLatest, isExpanded, toggleExpand }: any) {
  // Parse extra details serialized into description/remarks
  let parsedExtras: any = {};
  try {
    const rawData = record.remarks || record.description;
    if (rawData && typeof rawData === 'string' && rawData.trim().startsWith('{')) {
      parsedExtras = JSON.parse(rawData);
    }
  } catch (e) {
    // Ignore parse errors, just use as regular string
  }

  const mechanicName = parsedExtras.mechanic || record.mechanic_name || record.entered_by_username || 'Preetham';
  const serviceCenter = parsedExtras.center || record.service_center_name || 'FleetGuard Service Center';
  const cost = parsedExtras.cost || record.cost || record.total_cost || 0;
  
  let rawWork = parsedExtras.work || parsedExtras.description || parsedExtras.notes;
  if (!rawWork && (record.remarks || record.description)) {
    const raw = String(record.remarks || record.description).trim();
    if (!raw.startsWith('{')) {
      rawWork = raw;
    }
  }
  const workNotes = rawWork || record.notes || record.work_performed || 'General maintenance and inspection completed.';
  const nextDate = parsedExtras.nextDate || record.next_service_date;
  const nextKm = parsedExtras.nextKm || record.next_service_km;

  return (
    <div className="relative pl-8">
      {/* Timeline Dot */}
      <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ${isLatest ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
      
      {/* Record Card */}
      <div 
        className={`rounded-[16px] border transition-all duration-200 ${isExpanded ? 'border-blue-200 shadow-md bg-white' : 'border-slate-200 bg-transparent hover:bg-slate-50/50 cursor-pointer'}`}
        onClick={!isExpanded ? toggleExpand : undefined}
      >
        {/* Card Header (Always visible) */}
        <div className={`px-5 py-4 flex items-center justify-between ${isExpanded ? 'border-b border-slate-200 cursor-pointer hover:bg-slate-50/50 rounded-t-[16px] transition-colors' : ''}`} onClick={isExpanded ? toggleExpand : undefined}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
              <Calendar size={14} className="text-slate-400" />
              {new Date(record.service_date).toISOString().split('T')[0]}
            </div>
            
            {isLatest && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded uppercase tracking-widest">Latest</span>
            )}
            
            <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded uppercase tracking-widest border ${
              (record.service_type || '').toLowerCase().includes('engine')
                ? 'bg-red-50 text-red-700 border-red-200' 
                : (record.service_type || '').toLowerCase().includes('oil')
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-white text-[#1E3A8A] border-blue-200 shadow-sm'
            }`}>
              {record.service_type || 'General Service'}
            </span>

            <div className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-transparent px-2 py-0.5">
              <Clock size={12} className="text-slate-400" />
              {(record.mileage || record.current_mileage || 0).toLocaleString()} km
            </div>
          </div>
          
          <button className="text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-0">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="p-5 bg-transparent rounded-b-[16px] grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin size={10} /> SERVICE CENTER
              </span>
              <p className="text-sm font-bold text-slate-900">{serviceCenter}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <User size={10} /> MECHANIC
              </span>
              <p className="text-sm font-bold text-slate-900">{mechanicName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <DollarSign size={10} /> COST
              </span>
              <p className="text-sm font-bold text-slate-900">₹ {Number(cost).toLocaleString()}</p>
            </div>

            <div className="space-y-1 md:col-span-2 mt-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <FileText size={10} /> NOTES
              </span>
              <div className="bg-transparent text-sm text-slate-700 leading-relaxed max-w-[600px]">
                {workNotes}
              </div>
            </div>

            {(nextDate || nextKm) && (
              <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-200">
                {nextDate && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">NEXT SERVICE DATE</span>
                    <p className="text-sm font-bold text-slate-900">{new Date(nextDate).toISOString().split('T')[0]}</p>
                  </div>
                )}
                {nextKm && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">NEXT SERVICE KM</span>
                    <p className="text-sm font-bold text-slate-900">{Number(nextKm).toLocaleString()} km</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
