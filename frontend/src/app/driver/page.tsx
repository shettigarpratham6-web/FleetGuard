'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, ServiceRecord } from '@/types';

interface CheckItem {
  id: 'engine' | 'tires' | 'brakes' | 'lights';
  title: string;
  subtitle: string;
  icon: string;
  priority: 'Critical' | 'Required';
}

const CHECKS_LIST: CheckItem[] = [
  {
    id: 'engine',
    title: 'Engine & Fluids',
    subtitle: 'Check oil level, radiator coolant & battery terminals',
    icon: 'vital_signs',
    priority: 'Critical'
  },
  {
    id: 'tires',
    title: 'Tires & Wheels',
    subtitle: 'Inspect tread depth, tire pressure & lug nuts',
    icon: 'tire_repair',
    priority: 'Critical'
  },
  {
    id: 'brakes',
    title: 'Brake System',
    subtitle: 'Test brake pedal response & parking brake',
    icon: 'minor_crash',
    priority: 'Critical'
  },
  {
    id: 'lights',
    title: 'Lights & Wipers',
    subtitle: 'Inspect headlights, turn signals, mirrors & wipers',
    icon: 'light_mode',
    priority: 'Required'
  }
];

export default function DriverDashboardPage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Compliance Breakdown Drawer Toggle
  const [showCompliance, setShowCompliance] = useState(true);

  // 4 Pre-Trip Checklist Items State
  const [checklist, setChecklist] = useState<Record<string, boolean | null>>({
    engine: null,
    tires: null,
    brakes: null,
    lights: null
  });

  const [checkNotes, setCheckNotes] = useState<Record<string, string>>({});
  const [generalRemarks, setGeneralRemarks] = useState('');
  const [submittingChecklist, setSubmittingChecklist] = useState(false);

  // Odometer / Mileage States
  const [newMileage, setNewMileage] = useState<number>(0);
  const [updatingMileage, setUpdatingMileage] = useState(false);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = api.auth.getLocalUser();
    if (currentUser?.role !== 'Driver') {
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const myAssignments = await api.assignments?.getAll?.({ driver_id: currentUser.id, status: 'Active' });
        
        if (myAssignments && myAssignments.length > 0) {
          const activeAssignment = myAssignments[0];
          setAssignment(activeAssignment);
          
          const [v, docs, records] = await Promise.all([
            api.vehicles.getById(activeAssignment.vehicle_id),
            api.compliance.getAll().catch(() => []),
            api.services.getAll().catch(() => [])
          ]);
          
          setVehicle(v);
          setNewMileage(v.current_mileage || 0);
          setComplianceDocs(docs.filter(d => d.vehicle_id === v.id));
          setServiceRecords(records.filter(r => r.vehicle_id === v.id).sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()));
        }
      } catch (err) {
        console.error('Failed to load driver dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!vehicle) {
    return (
      <LayoutWrapper>
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-slate-400">directions_car</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">No Vehicle Assigned</h2>
          <p className="text-slate-500">You do not have a vehicle assigned to you currently. Please contact your Fleet Manager.</p>
        </div>
      </LayoutWrapper>
    );
  }

  const now = new Date();
  
  // Find document expirations
  const getDocExpiry = (type: string) => {
    const doc = complianceDocs.find(d => d.document_type.toLowerCase().includes(type.toLowerCase()));
    return doc ? doc.expiry_date : null;
  };

  const insuranceExp = getDocExpiry('insurance');
  const registrationExp = getDocExpiry('registration') || getDocExpiry('rc');
  const pollutionExp = getDocExpiry('pollution') || getDocExpiry('puc');
  const inspectionExp = getDocExpiry('inspection') || getDocExpiry('fitness');

  const docs = [
    { name: 'INSURANCE', exp: insuranceExp },
    { name: 'REGISTRATION', exp: registrationExp },
    { name: 'EMISSIONS', exp: pollutionExp },
    { name: 'SAFETY INSPECTION', exp: inspectionExp }
  ].filter(d => d.exp);

  const warnings = docs.filter(d => d.exp && new Date(d.exp) < now);
  const lastService = serviceRecords.length > 0 ? serviceRecords[0] : null;
  const isServiceOverdue = lastService?.next_service_date && new Date(lastService.next_service_date) < now;

  const isBlocked = warnings.length > 0 || isServiceOverdue || vehicle.status === 'Maintenance';

  // Checklist helper calculations
  const totalCount = CHECKS_LIST.length;
  const answeredCount = Object.values(checklist).filter(v => v !== null).length;
  const passedCount = Object.values(checklist).filter(v => v === true).length;
  const failedCount = Object.values(checklist).filter(v => v === false).length;

  const allPass = passedCount === totalCount;
  const isAllAnswered = answeredCount === totalCount;

  const handlePassAll = () => {
    setChecklist({ engine: true, tires: true, brakes: true, lights: true });
  };

  const handleReset = () => {
    setChecklist({ engine: null, tires: null, brakes: null, lights: null });
    setCheckNotes({});
  };
  
  const submitChecklist = async () => {
    try {
      setSubmittingChecklist(true);
      
      const failedNotes = CHECKS_LIST.filter(c => checklist[c.id] === false)
        .map(c => `${c.title}${checkNotes[c.id] ? `: ${checkNotes[c.id]}` : ''}`)
        .join('; ');

      const compiledRemarks = failedCount > 0 
        ? `Issues flagged: ${failedNotes}. ${generalRemarks}`.trim()
        : (generalRemarks || 'All checks passed.');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          tyres_ok: checklist.tires ?? true,
          brakes_ok: checklist.brakes ?? true,
          lights_ok: checklist.lights ?? true,
          horn_ok: checklist.lights ?? true,
          mirrors_ok: checklist.lights ?? true,
          remarks: compiledRemarks,
          status: failedCount > 0 ? 'Issues Reported' : 'Completed'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit checklist');
      }

      alert('Pre-trip duty checklist submitted successfully!');
    } catch(err: any) {
      alert(err.message || 'Failed to log checklist');
    } finally {
      setSubmittingChecklist(false);
    }
  };

  const handleUpdateMileage = async () => {
    if (!vehicle || newMileage < (vehicle.current_mileage || 0)) {
      alert('Mileage cannot be lower than current mileage.');
      return;
    }
    try {
      setUpdatingMileage(true);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({ current_mileage: newMileage })
      });
      setVehicle({ ...vehicle, current_mileage: newMileage });
      alert('Mileage updated successfully.');
    } catch (err) {
      alert('Failed to update mileage.');
    } finally {
      setUpdatingMileage(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto bg-slate-50 min-h-screen">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Driver Portal</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Duty Clearance Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time vehicle clearance & road status</p>
          </div>
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        </div>

        {/* Compliance Clearance Banner Block - Realistic Crimson & Emerald Tones */}
        <div className={`rounded-2xl shadow-xl overflow-hidden relative border transition-all duration-300 ${
          isBlocked 
            ? 'bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-white border-rose-800/80' 
            : 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 text-white border-emerald-800/80'
        }`}>
          <div className="p-6 md:p-7 relative z-10">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${
                isBlocked ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              }`}>
                <span className="material-symbols-outlined text-[36px]">{isBlocked ? 'report' : 'verified_user'}</span>
              </div>
              <div className="flex-1">
                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-2 border shadow-sm ${
                  isBlocked 
                    ? 'bg-rose-500/25 text-rose-200 border-rose-400/30 backdrop-blur-md' 
                    : 'bg-emerald-500/25 text-emerald-200 border-emerald-400/30 backdrop-blur-md'
                }`}>
                  {isBlocked ? 'DISPATCH BLOCKED' : 'ROADSIDE CLEARED'}
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                  {isBlocked ? 'Operation Locked / Regulatory Flag' : 'Vehicle Compliant & Authorized'}
                </h2>
                <p className="text-slate-200 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
                  {isBlocked 
                    ? `NOTICE: Vehicle ${vehicle.vehicle_number} has compliance flags or pending service.`
                    : `VERIFIED: Vehicle ${vehicle.vehicle_number} passed compliance checks. Cleared for duty.`}
                </p>
              </div>

              {/* Floating Vehicle Badge */}
              <div className="hidden sm:block bg-black/35 backdrop-blur-md rounded-xl p-3.5 border border-white/20 text-right min-w-[160px] shadow-sm">
                <p className="text-[10px] uppercase font-black text-slate-300 tracking-wider mb-0.5">Active Vehicle</p>
                <p className="text-xl font-black text-white tracking-wider font-mono">{vehicle.vehicle_number}</p>
                <p className="text-xs text-slate-200 font-bold">{vehicle.model}</p>
              </div>
            </div>
            
            {/* Compliance Breakdown Accordion Header */}
            <div className="mt-6 border-t border-white/15 pt-4">
              <button 
                onClick={() => setShowCompliance(!showCompliance)} 
                className="flex items-center gap-1.5 text-xs font-extrabold text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">{showCompliance ? 'expand_less' : 'expand_more'}</span>
                {showCompliance ? 'Hide' : 'Show'} Compliance Records Summary ({docs.length} checked)
              </button>
              
              {/* Compliance Breakdown Table Row Format */}
              {showCompliance && (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/20 bg-black/25 backdrop-blur-md shadow-inner">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/15 bg-black/30 text-[10px] font-black uppercase text-slate-300 tracking-wider">
                          <th className="py-3 px-4">Document Type</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Expiration Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {docs.map(doc => {
                          const isExp = new Date(doc.exp) < now;
                          return (
                            <tr key={doc.name} className="hover:bg-white/5 transition-colors">
                              <td className="py-3.5 px-4 font-extrabold text-white flex items-center gap-2">
                                <span className={`material-symbols-outlined text-[18px] ${isExp ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {isExp ? 'warning' : 'check_circle'}
                                </span>
                                {doc.name}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                                  isExp 
                                    ? 'bg-rose-500/30 text-rose-200 border-rose-400/40' 
                                    : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                                }`}>
                                  {isExp ? 'Expired' : 'Valid'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-200">
                                Exp: {new Date(doc.exp).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Duty Details & Mileage */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4">Assigned Duty Details</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">License Plate</p>
              <p className="font-extrabold text-blue-700 text-base font-mono">{vehicle.vehicle_number}</p>
            </div>
            
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Make & Model</p>
              <p className="font-extrabold text-slate-900 text-sm">{vehicle.manufacturer} {vehicle.model}</p>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">({vehicle.manufacturing_year || '2023'})</p>
            </div>
            
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Registration #</p>
              <p className="font-mono text-xs font-bold text-slate-800 truncate">{vehicle.registration_number || 'N/A'}</p>
            </div>
            
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Assignment</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 mt-1">
                {assignment?.status || 'Active'}
              </span>
            </div>
          </div>

          <div className="mt-4 md:w-[48%]">
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200 flex flex-col justify-between h-full">
              <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-2">Current Mileage</p>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={newMileage}
                  onChange={(e) => setNewMileage(Number(e.target.value))}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-inner"
                />
                <button 
                  onClick={handleUpdateMileage}
                  disabled={updatingMileage}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1d4ed8] hover:bg-blue-800 text-white text-xs font-extrabold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  {updatingMileage ? '...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Trip Safety & Duty Checklist */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6 space-y-5">
          
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-extrabold uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Pre-Flight Vehicle Audit
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Daily Pre-Trip Inspection</h3>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Mandatory 4-point safety verification • {answeredCount} of {totalCount} completed ({passedCount} Passed, {failedCount} Flagged)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handlePassAll} 
                className="flex items-center gap-1.5 px-4 py-2 border border-emerald-300 text-emerald-800 bg-emerald-50 rounded-full text-xs font-black hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                Approve All
              </button>
              <button 
                onClick={handleReset} 
                className="px-3.5 py-2 border border-slate-300 text-slate-700 bg-slate-100 rounded-full text-xs font-extrabold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${(passedCount / totalCount) * 100}%` }} />
            <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${(failedCount / totalCount) * 100}%` }} />
          </div>

          {/* 4 Table Row Cards */}
          <div className="space-y-3">
            {CHECKS_LIST.map((item) => {
              const status = checklist[item.id];
              const isPassed = status === true;
              const isFailed = status === false;

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col space-y-3 ${
                    isPassed 
                      ? 'bg-emerald-50/70 border-emerald-300 border-l-4 border-l-emerald-600 shadow-sm' 
                      : isFailed 
                      ? 'bg-rose-50/70 border-rose-300 border-l-4 border-l-rose-600 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex gap-3.5 items-start md:items-center">
                      <span className={`material-symbols-outlined text-2xl mt-0.5 md:mt-0 ${
                        isPassed ? 'text-emerald-700' : isFailed ? 'text-rose-700' : 'text-slate-500'
                      }`}>
                        {item.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-black text-slate-900 text-sm">{item.title}</span>
                          <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                            item.priority === 'Critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => setChecklist(p => ({ ...p, [item.id]: true }))} 
                        className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isPassed 
                            ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-200 shadow-sm' 
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span> VERIFIED
                      </button>
                      <button 
                        onClick={() => setChecklist(p => ({ ...p, [item.id]: false }))} 
                        className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isFailed 
                            ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-200 shadow-sm' 
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">warning</span> DEFECT
                      </button>
                    </div>
                  </div>

                  {/* Inline failure comment box */}
                  {isFailed && (
                    <div className="pt-2 border-t border-rose-200">
                      <input
                        type="text"
                        placeholder="Describe issue (e.g. low pressure, fluid leak)..."
                        value={checkNotes[item.id] || ''}
                        onChange={(e) => setCheckNotes({ ...checkNotes, [item.id]: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-rose-950 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* General Remarks input */}
          <div className="pt-2">
            <input 
              type="text" 
              value={generalRemarks}
              onChange={(e) => setGeneralRemarks(e.target.value)}
              placeholder="Additional inspection notes or supervisor remarks (optional)..."
              className="w-full border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer Submit Bar */}
          <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-100">
            {allPass ? (
              <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full border border-emerald-300 shadow-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                Audit Status: APPROVED
              </span>
            ) : isAllAnswered && failedCount > 0 ? (
              <span className="px-4 py-2 bg-rose-100 text-rose-800 font-extrabold text-xs rounded-full border border-rose-300 shadow-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-rose-600">warning</span>
                Audit Status: DEFECTS ({failedCount} Issue{failedCount > 1 ? 's' : ''})
              </span>
            ) : answeredCount > 0 ? (
              <span className="px-4 py-2 bg-amber-50 text-amber-800 font-extrabold text-xs rounded-full border border-amber-300 shadow-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-600">pending</span>
                In Progress ({answeredCount}/{totalCount})
              </span>
            ) : (
              <span className="px-4 py-2 bg-slate-100 text-slate-600 font-extrabold text-xs rounded-full border border-slate-200">
                Pending Selection
              </span>
            )}

            <button 
              onClick={submitChecklist}
              disabled={isBlocked || !isAllAnswered || submittingChecklist}
              className={`px-6 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-sm flex items-center gap-2 border-0 ${
                isAllAnswered && !isBlocked
                  ? failedCount > 0
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submittingChecklist ? (
                'Logging...'
              ) : isAllAnswered ? (
                allPass ? 'Submit Safety Audit (PASS)' : 'Submit Safety Audit (DEFECTS)'
              ) : (
                'Submit Safety Audit'
              )}
            </button>
          </div>

        </div>

      </div>
    </LayoutWrapper>
  );
}