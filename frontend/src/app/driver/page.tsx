'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, ServiceRecord } from '@/types';

export default function DriverDashboardPage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // New UI states
  const [showCompliance, setShowCompliance] = useState(true);
  const [checklist, setChecklist] = useState({
    tires: null as boolean | null,
    brakes: null as boolean | null,
    fluids: null as boolean | null,
    safety: null as boolean | null
  });
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
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen flex flex-col items-center justify-center">
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
  
  // Find expirations
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
  ].filter(d => d.exp); // only show docs we have data for

  const warnings = docs.filter(d => d.exp && new Date(d.exp) < now);
  const lastService = serviceRecords.length > 0 ? serviceRecords[0] : null;
  const isServiceOverdue = lastService?.next_service_date && new Date(lastService.next_service_date) < now;

  const isBlocked = warnings.length > 0 || isServiceOverdue || vehicle.status === 'Maintenance';

  const allPass = checklist.tires && checklist.brakes && checklist.fluids && checklist.safety;
  const handlePassAll = () => setChecklist({ tires: true, brakes: true, fluids: true, safety: true });
  
  const submitChecklist = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          tyres_ok: checklist.tires,
          brakes_ok: checklist.brakes,
          lights_ok: checklist.safety,
          horn_ok: checklist.safety,
          mirrors_ok: checklist.safety,
          remarks: !allPass ? 'Failed some checks. Fluids: ' + checklist.fluids : 'None'
        })
      });
      alert('Checklist logged successfully!');
    } catch(err) {
      alert('Failed to log checklist');
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
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Driver Console</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Driver Duty Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time vehicle assignment compliance & road-legal clearance</p>
          </div>
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        </div>

        {/* Compliance Block */}
        <div className={`rounded-xl shadow-md overflow-hidden relative ${isBlocked ? 'bg-[#b71c1c] text-white' : 'bg-[#00695c] text-white'}`}>
          <div className="p-6">
            <div className="flex items-start gap-4 relative z-10">
              <span className="material-symbols-outlined text-[40px]">{isBlocked ? 'report' : 'verified_user'}</span>
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold uppercase tracking-wider mb-2">
                  {isBlocked ? 'Legal Risk' : 'Clearance Active'}
                </span>
                <h2 className="text-2xl font-extrabold mb-1">
                  {isBlocked ? 'Operation Blocked / Legal Risk' : 'Vehicle Compliant / Road Legal'}
                </h2>
                <p className="text-white/90 text-sm max-w-2xl">
                  {isBlocked 
                    ? `CRITICAL ALERT: Assigned vehicle ${vehicle.vehicle_number} has compliance violations or is under maintenance. Do not operate on public roads.`
                    : `SUCCESS: Assigned vehicle ${vehicle.vehicle_number} has passed all digital compliance checks. You are cleared for duty.`}
                </p>
              </div>

              {/* Floating Vehicle Badge */}
              <div className="hidden sm:block bg-black/20 rounded-lg p-3 border border-white/10 text-right min-w-[160px]">
                <p className="text-[10px] uppercase font-bold text-white/60 mb-0.5">Assigned Vehicle</p>
                <p className="text-xl font-black tracking-wider">{vehicle.vehicle_number}</p>
                <p className="text-xs text-white/80">{vehicle.model}</p>
              </div>
            </div>
            
            <div className="mt-6 border-t border-white/20 pt-4">
              <button onClick={() => setShowCompliance(!showCompliance)} className="flex items-center gap-1 text-sm font-bold text-white/90 hover:text-white transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">{showCompliance ? 'expand_less' : 'expand_more'}</span>
                {showCompliance ? 'Hide' : 'Show'} Compliance Breakdown ({docs.length} documents checked)
              </button>
              
              {showCompliance && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {docs.map(doc => {
                    const isExp = new Date(doc.exp) < now;
                    return (
                      <div key={doc.name} className={`rounded-lg p-3 border ${isExp ? 'bg-black/20 border-red-400' : 'bg-black/10 border-white/10'}`}>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white/90 mb-2">
                          <span className={`material-symbols-outlined text-[16px] ${isExp ? 'text-red-300' : 'text-emerald-400'}`}>
                            {isExp ? 'warning' : 'check_circle'}
                          </span>
                          {doc.name}
                        </div>
                        <div className="flex justify-between items-end mt-4">
                          <span className={`text-[11px] font-black uppercase tracking-wider ${isExp ? 'text-red-300' : 'text-emerald-400'}`}>
                            {isExp ? 'Expired' : 'Valid'}
                          </span>
                          <span className="text-[10px] text-white/60">Exp: {new Date(doc.exp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Duty Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4">Assigned Duty Details</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">License Plate</p>
              <p className="font-extrabold text-blue-700">{vehicle.vehicle_number}</p>
            </div>
            
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Make & Model</p>
              <p className="font-bold text-slate-900 text-sm">{vehicle.manufacturer} {vehicle.model}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">({vehicle.manufacturing_year || '2023'})</p>
            </div>
            
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Registration #</p>
              <p className="font-mono text-xs font-bold text-slate-700 truncate">{vehicle.registration_number || 'N/A'}</p>
            </div>
            
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assignment</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                {assignment.status || 'Active'}
              </span>
            </div>
          </div>

          <div className="mt-4 md:w-[48%]">
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-100 flex flex-col justify-between h-full">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Current Mileage</p>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={newMileage}
                  onChange={(e) => setNewMileage(Number(e.target.value))}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button 
                  onClick={handleUpdateMileage}
                  disabled={updatingMileage}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1d4ed8] hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  {updatingMileage ? '...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Trip Checklist */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                Pre-Trip Safety Check
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Vehicle Duty Checklist</h3>
              <p className="text-sm text-slate-500 mt-1">Fast 4-item tap-through inspection before departure</p>
            </div>
            <button onClick={handlePassAll} className="flex items-center gap-1.5 px-4 py-2 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              All Pass
            </button>
          </div>

          <div className="space-y-3">
            {/* Tires */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between md:items-center gap-4 ${checklist.tires === true ? 'bg-emerald-50/50 border-emerald-200' : checklist.tires === false ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex gap-3 items-start md:items-center">
                <span className={`material-symbols-outlined mt-0.5 md:mt-0 ${checklist.tires === true ? 'text-emerald-500' : checklist.tires === false ? 'text-red-500' : 'text-slate-400'}`}>trip_origin</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Tires & Lights</p>
                  <p className="text-xs text-slate-500 mt-0.5">Tread depth, tire pressure, headlights, brake lights & turn signals</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setChecklist(p => ({...p, tires: true}))} className={`px-5 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${checklist.tires === true ? 'bg-[#00897b] text-white border-[#00897b]' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}><span className="material-symbols-outlined text-[16px]">check_circle</span> PASS</button>
                <button onClick={() => setChecklist(p => ({...p, tires: false}))} className={`px-5 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${checklist.tires === false ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><span className="material-symbols-outlined text-[16px]">warning</span> FAIL</button>
              </div>
            </div>

            {/* Brakes */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between md:items-center gap-4 ${checklist.brakes === true ? 'bg-emerald-50/50 border-emerald-200' : checklist.brakes === false ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex gap-3 items-start md:items-center">
                <span className={`material-symbols-outlined mt-0.5 md:mt-0 ${checklist.brakes === true ? 'text-emerald-500' : checklist.brakes === false ? 'text-red-500' : 'text-slate-400'}`}>error</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Brake System</p>
                  <p className="text-xs text-slate-500 mt-0.5">Foot brake responsiveness, air brake pressure & emergency parking brake</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setChecklist(p => ({...p, brakes: true}))} className={`px-5 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${checklist.brakes === true ? 'bg-[#00897b] text-white border-[#00897b]' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}><span className="material-symbols-outlined text-[16px]">check_circle</span> PASS</button>
                <button onClick={() => setChecklist(p => ({...p, brakes: false}))} className={`px-5 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${checklist.brakes === false ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><span className="material-symbols-outlined text-[16px]">warning</span> FAIL</button>
              </div>
            </div>

            {/* Fluids */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between md:items-center gap-4 ${checklist.fluids === true ? 'bg-emerald-50/50 border-emerald-200' : checklist.fluids === false ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex gap-3 items-start md:items-center">
                <span className={`material-symbols-outlined mt-0.5 md:mt-0 ${checklist.fluids === true ? 'text-emerald-500' : checklist.fluids === false ? 'text-red-500' : 'text-slate-400'}`}>water_drop</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Fluid Levels</p>
                  <p className="text-xs text-slate-500 mt-0.5">Engine oil level, radiator coolant, windshield washer fluid</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setChecklist(p => ({...p, fluids: true}))} className={`px-5 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${checklist.fluids === true ? 'bg-[#00897b] text-white border-[#00897b]' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}><span className="material-symbols-outlined text-[16px]">check_circle</span> PASS</button>
                <button onClick={() => setChecklist(p => ({...p, fluids: false}))} className={`px-5 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${checklist.fluids === false ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><span className="material-symbols-outlined text-[16px]">warning</span> FAIL</button>
              </div>
            </div>

            {/* Safety */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between md:items-center gap-4 ${checklist.safety === true ? 'bg-emerald-50/50 border-emerald-200' : checklist.safety === false ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex gap-3 items-start md:items-center">
                <span className={`material-symbols-outlined mt-0.5 md:mt-0 ${checklist.safety === true ? 'text-emerald-500' : checklist.safety === false ? 'text-red-500' : 'text-slate-400'}`}>health_and_safety</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Safety Equipment</p>
                  <p className="text-xs text-slate-500 mt-0.5">Seatbelts operational, fire extinguisher charged, reflective triangles</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setChecklist(p => ({...p, safety: true}))} className={`px-5 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${checklist.safety === true ? 'bg-[#00897b] text-white border-[#00897b]' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}><span className="material-symbols-outlined text-[16px]">check_circle</span> PASS</button>
                <button onClick={() => setChecklist(p => ({...p, safety: false}))} className={`px-5 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${checklist.safety === false ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><span className="material-symbols-outlined text-[16px]">warning</span> FAIL</button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
            {allPass ? (
              <span className="px-5 py-2 bg-emerald-100 text-emerald-800 font-extrabold text-sm rounded-full border border-emerald-200 shadow-sm">Overall: PASS</span>
            ) : (
              <span className="px-5 py-2 bg-slate-100 text-slate-600 font-extrabold text-sm rounded-full border border-slate-200">Pending Selection</span>
            )}
            <button 
              onClick={submitChecklist}
              disabled={isBlocked || checklist.tires === null || checklist.brakes === null || checklist.fluids === null || checklist.safety === null}
              className="px-8 py-3 bg-[#00897b] hover:bg-[#00796b] text-white font-extrabold rounded-lg disabled:opacity-50 transition-colors shadow-md cursor-pointer"
            >
              Log Checklist ({allPass ? 'PASS' : 'FAIL'})
            </button>
          </div>
        </div>

      </div>
    </LayoutWrapper>
  );
}