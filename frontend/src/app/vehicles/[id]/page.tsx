'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, ServiceRecord, MaintenanceRisk } from '@/types';

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle & { compliance_documents?: any[] } | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add Compliance Modal State
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [docType, setDocType] = useState('Insurance');
  const [docNumber, setDocNumber] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [risk, setRisk] = useState<MaintenanceRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Additional states for vehicle assignment and compliance check
  const [userRole, setUserRole] = useState<string>('Driver');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<any | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = api.auth.getLocalUser();
    if (currentUser) {
      setUserRole(currentUser.role);
    }

    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        // Fetch vehicle details (which includes compliance docs from backend)
        const vData = await api.vehicles.getById(id);
        setVehicle(vData);

        // Fetch service records, risks, active assignment, and overall compliance status
        const [servicesData, risksData, activeAssignData, compStatusData, driversData] = await Promise.all([
          api.services.getAll(),
          api.risks.getAll(),
          api.assignments.getAll({ vehicle_id: id, status: 'Active' }),
          api.compliance.getVehicleStatus(id),
          currentUser && ['Admin', 'Fleet Manager', 'Manager'].includes(currentUser.role) ? api.auth.getUsers('Driver', 'Active') : Promise.resolve([])
        ]);

        // Filter for this specific vehicle
        setServiceRecords(servicesData.filter(sr => sr.vehicle_id === id));
        setRisk(risksData.find(r => r.vehicle_id === id) || null);
        setActiveAssignment(activeAssignData && activeAssignData.length > 0 ? activeAssignData[0] : null);
        setComplianceStatus(compStatusData);
        setDrivers(driversData || []);

      } catch (err: any) {
        console.error('Error fetching vehicle details:', err);
        setError(err.message || 'Failed to load vehicle details.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [id, router]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setAssignError('Please select a driver.');
      return;
    }

    const isNonCompliant = complianceStatus?.overall_status === 'Non-Compliant';
    if (isNonCompliant && !overrideReason.trim()) {
      setAssignError('This vehicle is non-compliant. A manager override reason is required.');
      return;
    }

    setAssignLoading(true);
    setAssignError('');

    try {
      let overrideLogId = '';
      if (isNonCompliant) {
        const overrideRes = await api.overrideLogs.create({
          vehicle_id: id,
          reason: overrideReason.trim()
        });
        overrideLogId = overrideRes.overrideLog.id;
      }

      await api.assignments.create({
        vehicle_id: id,
        driver_id: selectedDriverId,
        override_used: isNonCompliant,
        override_log_id: overrideLogId || undefined
      });

      // Reset state
      setIsAssignModalOpen(false);
      setSelectedDriverId('');
      setOverrideReason('');
      
      // Refresh page data
      const vData = await api.vehicles.getById(id);
      setVehicle(vData);
      const [activeAssignData, compStatusData] = await Promise.all([
        api.assignments.getAll({ vehicle_id: id, status: 'Active' }),
        api.compliance.getVehicleStatus(id)
      ]);
      setActiveAssignment(activeAssignData && activeAssignData.length > 0 ? activeAssignData[0] : null);
      setComplianceStatus(compStatusData);

    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign vehicle.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleReturnVehicle = async () => {
    if (!activeAssignment) return;
    if (!confirm('Are you sure you want to log return of this vehicle?')) return;

    setLoading(true);
    try {
      await api.assignments.returnVehicle(activeAssignment.id);
      
      // Refresh page data
      const vData = await api.vehicles.getById(id);
      setVehicle(vData);
      const [activeAssignData, compStatusData] = await Promise.all([
        api.assignments.getAll({ vehicle_id: id, status: 'Active' }),
        api.compliance.getVehicleStatus(id)
      ]);
      setActiveAssignment(activeAssignData && activeAssignData.length > 0 ? activeAssignData[0] : null);
      setComplianceStatus(compStatusData);
    } catch (err: any) {
      alert(err.message || 'Failed to return vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docExpiry || !docType) return;
    setSubmittingDoc(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/compliance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({
          vehicle_id: id,
          document_type: docType,
          document_number: docNumber,
          expiry_date: docExpiry,
          status: 'Valid'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add document');
      
      alert('Compliance document added successfully!');
      setIsAddDocOpen(false);
      // Reload page to get new data
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingDoc(false);
    }
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-semibold text-sm text-slate-600">Loading vehicle profile...</p>
        </div>
      </LayoutWrapper>
    );
  }

  if (error || !vehicle) {
    return (
      <LayoutWrapper>
        <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-[64px] text-slate-300 mb-4">error</span>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Vehicle Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'The requested vehicle could not be loaded.'}</p>
          <button onClick={() => router.back()} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold border-0 cursor-pointer">
            Go Back
          </button>
        </div>
      </LayoutWrapper>
    );
  }

  // Compute status color classes
  const statusColorClass =
    vehicle.status === 'Maintenance'
      ? 'bg-rose-100 text-rose-700'
      : vehicle.status === 'Assigned'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-slate-100 text-slate-700 border border-slate-200';

  const complianceDocs = vehicle.compliance_documents || [];

  return (
    <LayoutWrapper searchPlaceholder="Search services for this vehicle...">
      <div className="p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full space-y-8 bg-slate-50 min-h-screen text-slate-900">
        {/* Sticky Header (Context) */}
        <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2 font-bold text-sm cursor-pointer border-0 bg-transparent"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Fleet
          </button>
          <span className="text-outline-variant" aria-hidden="true">/</span>
          <span className="text-[13px] text-on-surface-variant">Vehicles</span>
          <span className="text-outline-variant" aria-hidden="true">/</span>
          <span className="text-[13px] font-semibold text-on-surface font-mono">{vehicle.vehicle_number}</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 animate-fade-in-up">
          <div>
            <span className="font-bold text-xs text-blue-600 uppercase tracking-wider block mb-1">
              Vehicle Profile
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              {vehicle.vehicle_number}
            </h2>
            <p className="text-[13px] text-on-surface-variant mt-1">
              {vehicle.manufacturer} {vehicle.model} • {vehicle.manufacturing_year || 'N/A'} • {vehicle.fuel_type || 'N/A'}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {['Admin', 'Fleet Manager', 'Manager'].includes(userRole) && (
              <>
                {activeAssignment ? (
                  <button
                    onClick={handleReturnVehicle}
                    className="flex items-center gap-2 px-4 py-2.5 text-white bg-rose-600 hover:bg-rose-700 rounded-xl text-[13px] font-semibold shadow-md cursor-pointer border-0 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                    Return Vehicle
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl text-[13px] font-semibold shadow-md cursor-pointer border-0 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    Assign Driver
                  </button>
                )}
              </>
            )}
            <Link href="/service-records/create">
              <button className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-[13px] font-semibold shadow-md cursor-pointer btn-scale border-0 focus-ring hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
                New Service Record
              </button>
            </Link>
          </div>
        </div>

        {/* Active Assignment Info Banner */}
        {activeAssignment && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 animate-pulse">
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Active Vehicle Assignment</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Assigned to <span className="font-semibold">{activeAssignment.driver_name}</span> ({activeAssignment.driver_email}) by {activeAssignment.assigned_by_name} on {new Date(activeAssignment.assigned_date).toLocaleDateString()}
                </p>
                {activeAssignment.override_used && (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                    <span className="material-symbols-outlined text-[12px]">warning</span>
                    Assigned via Manager Override
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Stats Summary (Bento Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main Info Card (Spans 2 columns) */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex gap-6 items-center relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="w-24 h-24 rounded-2xl bg-blue-50 flex-shrink-0 border border-blue-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[48px]">
                {vehicle.vehicle_type === 'Light Van' ? 'directions_car' : 'local_shipping'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${statusColorClass}`}>
                  {vehicle.status}
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">
                  VIN: {vehicle.registration_number}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {vehicle.manufacturer} {vehicle.model}
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Branch ID: {vehicle.branch_id.substring(0, 8)}... • Year: {vehicle.manufacturing_year || 'N/A'}
              </p>
              <p className="text-[12px] text-on-surface-variant mt-0.5">Type: {vehicle.vehicle_type}</p>
            </div>
          </div>

          {/* Odometer Stat */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Odometer</span>
              <span className="material-symbols-outlined text-blue-600">speed</span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">
                {(vehicle.current_mileage / 1000).toFixed(0)}k
              </span>
              <span className="text-sm font-semibold text-slate-500 ml-1">
                ({vehicle.current_mileage.toLocaleString()} mi)
              </span>
              <p className="text-[11px] text-on-surface-variant mt-1">{vehicle.current_mileage.toLocaleString()} mi total</p>
            </div>
          </div>

          {/* Health Score Stat */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start z-10">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Health Score</span>
              <span className="material-symbols-outlined text-emerald-500">health_and_safety</span>
            </div>
            <div className="mt-4 z-10">
              <span className="text-3xl font-extrabold text-slate-900">
                {risk?.risk_level === 'High' ? '68' : risk?.risk_level === 'Medium' ? '82' : '96'}
              </span>
              <span className="text-sm font-semibold text-slate-500 ml-1">/100</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Service Timeline Header */}
            <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Service History</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Chronological log of maintenance performed on this asset.
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
                </button>
              </div>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-4 md:pl-6 py-2 space-y-6">
              {/* Vertical Connecting Line */}
              {serviceRecords.length > 1 && (
                <div className="absolute left-[20px] md:left-[28px] top-6 bottom-6 w-px bg-slate-200 pointer-events-none z-0"></div>
              )}

              {serviceRecords.length > 0 ? (
                serviceRecords.map((record) => {
                  const isMajor = Number(record.total_cost) > 500;
                  const nodeColor = isMajor ? 'bg-rose-500' : 'bg-blue-500';
                  const bannerColorClass = isMajor ? 'bg-rose-500' : 'bg-blue-600';
                  const labelColorClass = isMajor ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-blue-700 bg-blue-50 border border-blue-200';

                  return (
                    <div key={record.id} className="relative pl-[40px] group z-10">
                      {/* Node dot */}
                      <div className={`absolute left-[12px] md:left-[20px] top-6 w-4 h-4 rounded-full ${nodeColor} border-4 border-white z-10 shadow-sm group-hover:scale-125 transition-all`} />

                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${bannerColorClass}`}></div>

                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${labelColorClass}`}>
                                {isMajor ? 'Major Repair' : 'Routine Maintenance'}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-500">
                                {new Date(record.service_date).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900">
                              {record.service_type}
                            </h4>
                            {(() => {
                              let workText = record.description || 'General maintenance completed.';
                              let mechanicName = '';
                              let centerName = '';

                              if (record.description && typeof record.description === 'string' && record.description.trim().startsWith('{')) {
                                try {
                                  const parsed = JSON.parse(record.description);
                                  workText = parsed.work || parsed.description || parsed.notes || 'General maintenance completed.';
                                  mechanicName = parsed.mechanic || '';
                                  centerName = parsed.center || '';
                                } catch (e) {}
                              }

                              return (
                                <>
                                  <p className="text-sm font-semibold text-slate-700 mt-2">
                                    {workText}
                                  </p>
                                  {(centerName || mechanicName) && (
                                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                                      {centerName && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                          <span className="material-symbols-outlined text-[14px] text-blue-600">store</span>
                                          {centerName}
                                        </span>
                                      )}
                                      {mechanicName && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                          <span className="material-symbols-outlined text-[14px] text-blue-600">person</span>
                                          Tech: {mechanicName}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-lg font-mono font-extrabold text-slate-900 block">
                              ${Number(record.total_cost).toFixed(2)}
                            </span>
                            <Link href={`/service-records/${record.id}`}>
                              <button className="mt-2 text-blue-600 hover:underline text-xs font-bold flex items-center gap-1 ml-auto transition-colors cursor-pointer border-0 bg-transparent">
                                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                View Details
                              </button>
                            </Link>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 py-3 px-5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">
                              Odometer Recorded
                            </span>
                            <span className="font-mono text-sm font-bold text-slate-900">
                              {Number(record.current_mileage).toLocaleString()} mi
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">
                              Parts Replaced
                            </span>
                            <span className="text-sm font-semibold text-slate-800 truncate block" title={record.parts_changed}>
                              {record.parts_changed || 'None'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-sm font-medium text-slate-500 shadow-sm">
                  No service records found for this asset.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Compliance Documents Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">verified_user</span>
                  Compliance & Documents
                </h3>
                {['Admin', 'Fleet Manager', 'Manager'].includes(userRole) && (
                  <button onClick={() => setIsAddDocOpen(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer">
                    + Add
                  </button>
                )}
              </div>

              {/* Overall compliance status banner */}
              {complianceStatus && (
                <div className={`p-4 rounded-xl border mb-4 flex items-center gap-3 ${complianceStatus.overall_status === 'Compliant' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                  <span className="material-symbols-outlined shrink-0">
                    {complianceStatus.overall_status === 'Compliant' ? 'check_circle' : 'cancel'}
                  </span>
                  <div>
                    <p className="font-bold text-xs uppercase">Overall Status: {complianceStatus.overall_status}</p>
                    {complianceStatus.missing_documents && complianceStatus.missing_documents.length > 0 && (
                      <p className="text-[10px] mt-0.5 font-semibold">Missing: {complianceStatus.missing_documents.join(', ')}</p>
                    )}
                    {complianceStatus.expired_documents && complianceStatus.expired_documents.length > 0 && (
                      <p className="text-[10px] mt-0.5 font-semibold">Expired: {complianceStatus.expired_documents.map((d: any) => d.document_type).join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {complianceDocs.length > 0 ? (
                  complianceDocs.map((doc: any) => {
                    const isExpired = new Date(doc.expiry_date) < new Date();
                    const statusClass = isExpired || doc.status === 'Expired'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700';

                    return (
                      <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm text-slate-900">{doc.document_type}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusClass}`}>
                            {isExpired ? 'Expired' : doc.status}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-slate-500 mb-2">
                          No: {doc.document_number || 'N/A'}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">event</span>
                            Exp: {new Date(doc.expiry_date).toLocaleDateString()}
                          </span>
                          {doc.file_url && (
                            <a href={`http://127.0.0.1:5001${doc.file_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1">
                              View <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-500">
                    No compliance documents attached.
                  </div>
                )}
              </div>
              <button className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                Upload Document
              </button>
            </div>

            {/* Active Risk Summary */}
            {risk && (
              <div className={`rounded-2xl border p-6 shadow-sm ${risk.risk_level === 'High' ? 'bg-rose-50 border-rose-200' : risk.risk_level === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className={`material-symbols-outlined ${risk.risk_level === 'High' ? 'text-rose-600' : risk.risk_level === 'Medium' ? 'text-amber-600' : 'text-slate-500'}`}>
                    warning
                  </span>
                  Active Maintenance Risk
                </h3>
                <p className="text-sm font-semibold text-slate-700 mb-3">{risk.summary || 'No immediate concerns detected.'}</p>
                <div className="flex justify-between items-center text-xs font-bold mt-4 pt-4 border-t border-slate-200/60">
                  <span className="text-slate-500 uppercase">Risk Level</span>
                  <span className={`${risk.risk_level === 'High' ? 'text-rose-600' : risk.risk_level === 'Medium' ? 'text-amber-600' : 'text-slate-600'}`}>{risk.risk_level}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ASSIGN DRIVER MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto" onClick={() => setIsAssignModalOpen(false)}>
          <div className="bg-white rounded-[1.5rem] shadow-2xl overflow-hidden animate-slide-up transform transition-all border border-slate-100 relative my-auto shrink-0 w-[92vw] sm:w-[480px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-1.5 rounded-lg font-bold">person_add</span>
                Assign Driver to Vehicle
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer border-0 bg-transparent">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {assignError && (
                <div className="p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {assignError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Select Driver</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((driver: any) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} ({driver.email})
                    </option>
                  ))}
                </select>
              </div>

              {complianceStatus?.overall_status === 'Non-Compliant' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex gap-2 text-amber-800">
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">warning</span>
                    <div>
                      <p className="font-bold text-xs uppercase">Regulatory Clearance Override Required</p>
                      <p className="text-[11px] mt-0.5">
                        This vehicle has pending document audits or maintenance flags. Assignment requires supervisor authorization reasoning.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-amber-800 mb-1">Supervisor Override Justification *</label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      required
                      placeholder="Enter official supervisor reasoning for dispatching this vehicle..."
                      rows={3}
                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer border-0 flex items-center gap-2"
                >
                  {assignLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Assigning...
                    </>
                  ) : 'Assign Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}
