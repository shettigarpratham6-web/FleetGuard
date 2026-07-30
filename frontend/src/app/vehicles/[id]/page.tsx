'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
<<<<<<< HEAD
import { db } from '@/data/mockDb';
=======
>>>>>>> 7a041c7 (maintenance risks)
import { Vehicle, ServiceRecord, MaintenanceRisk } from '@/types';

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

<<<<<<< HEAD
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [risks, setRisks] = useState<MaintenanceRisk | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVehicleData = async () => {
      try {
        setLoading(true);
        // Try fetching from backend API
        let foundVehicle: Vehicle | null = null;
        try {
          foundVehicle = await api.vehicles.getById(id);
        } catch {
          const allVehicles = await api.vehicles.getAll();
          foundVehicle = allVehicles.find(v => v.id === id) || null;
        }

        if (foundVehicle) {
          setVehicle(foundVehicle);
          try {
            const records = await api.services.getByVehicle(id);
            setServiceRecords(records || []);
          } catch {
            setServiceRecords(db.getServiceRecords().filter(sr => sr.vehicle_id === id));
          }
          try {
            const riskList = await api.risks.getAll();
            setRisks(riskList.find(r => r.vehicle_id === id) || null);
          } catch {
            setRisks(db.getMaintenanceRisks().find(r => r.vehicle_id === id) || null);
          }
        } else {
          // Fallback to mock db
          const mockV = db.getVehicle(id) || db.getVehicles()[0];
          setVehicle(mockV);
          setServiceRecords(db.getServiceRecords().filter(sr => sr.vehicle_id === mockV.id));
          setRisks(db.getMaintenanceRisks().find(r => r.vehicle_id === mockV.id) || null);
        }
      } catch (err) {
        console.error('Error loading vehicle details from API:', err);
        const mockV = db.getVehicle(id) || db.getVehicles()[0];
        setVehicle(mockV);
        setServiceRecords(db.getServiceRecords().filter(sr => sr.vehicle_id === mockV.id));
        setRisks(db.getMaintenanceRisks().find(r => r.vehicle_id === mockV.id) || null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVehicleData();
    }
  }, [id]);

  if (loading || !vehicle) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body-md text-on-surface-variant">Loading vehicle details...</p>
        </div>
      </LayoutWrapper>
    );
  }

  const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    Maintenance: { bg: 'bg-error-container', text: 'text-error', border: 'border-error/30', dot: 'bg-error' },
    Assigned:    { bg: 'bg-primary-fixed', text: 'text-primary', border: 'border-primary/30', dot: 'bg-primary' },
    Available:   { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
    Inactive:    { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', border: 'border-outline-variant', dot: 'bg-outline' },
  };
  const sc = statusConfig[vehicle.status] || statusConfig['Available'];

  const totalSpend = serviceRecords.reduce((acc, sr) => acc + Number(sr.total_cost), 0);
  const lastService = serviceRecords.sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())[0];

  return (
    <LayoutWrapper searchPlaceholder="Search services for this vehicle...">
      <div className="p-lg md:p-margin-desktop max-w-7xl mx-auto space-y-lg">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 pb-4 border-b border-outline-variant/40 animate-fade-in-up">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-[13px] font-medium cursor-pointer border-0 bg-transparent focus-ring rounded-lg p-1 -ml-1"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
            Back
=======
  const [vehicle, setVehicle] = useState<Vehicle & { compliance_documents?: any[] } | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [risk, setRisk] = useState<MaintenanceRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        // Fetch vehicle details (which includes compliance docs from backend)
        const vData = await api.vehicles.getById(id);
        setVehicle(vData);

        // Fetch service records and risks
        const [servicesData, risksData] = await Promise.all([
          api.services.getAll(),
          api.risks.getAll()
        ]);

        // Filter for this specific vehicle
        setServiceRecords(servicesData.filter(sr => sr.vehicle_id === id));
        setRisk(risksData.find(r => r.vehicle_id === id) || null);

      } catch (err: any) {
        console.error('Error fetching vehicle details:', err);
        setError(err.message || 'Failed to load vehicle details.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [id, router]);

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
          <button onClick={() => router.back()} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">
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
            className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2 font-bold text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Fleet
>>>>>>> 7a041c7 (maintenance risks)
          </button>
          <span className="text-outline-variant" aria-hidden="true">/</span>
          <span className="text-[13px] text-on-surface-variant">Vehicles</span>
          <span className="text-outline-variant" aria-hidden="true">/</span>
          <span className="text-[13px] font-semibold text-on-surface font-mono">{vehicle.vehicle_number}</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 animate-fade-in-up">
          <div>
<<<<<<< HEAD
            <div className="flex items-center gap-3 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} aria-hidden="true" />
                {vehicle.status}
              </span>
              <span className="font-mono text-[12px] text-on-surface-variant">
                VIN: {vehicle.registration_number}
              </span>
            </div>
            <h2 className="font-black text-[26px] md:text-[30px] text-primary leading-tight">
              Asset {vehicle.vehicle_number}
=======
            <span className="font-bold text-xs text-blue-600 uppercase tracking-wider block mb-1">
              Vehicle Profile
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              {vehicle.vehicle_number}
>>>>>>> 7a041c7 (maintenance risks)
            </h2>
            <p className="text-[13px] text-on-surface-variant mt-1">
              {vehicle.manufacturer} {vehicle.model} • {vehicle.manufacturing_year || 'N/A'} • {vehicle.fuel_type || 'N/A'}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href="/service-records/create">
              <button className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-[13px] font-semibold shadow-md cursor-pointer btn-scale border-0 focus-ring hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
                New Service Record
              </button>
            </Link>
          </div>
        </div>

<<<<<<< HEAD
        {/* Stats Bento Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children" aria-label="Vehicle statistics">
          {/* Main Info Card */}
          <div className="col-span-2 bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm hover:shadow-md transition-all card-hover flex gap-5 items-center animate-fade-in-up relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5">
              <span className="material-symbols-outlined text-[120px] text-primary" aria-hidden="true">
                {vehicle.vehicle_type === 'Light Van' ? 'directions_car' : 'local_shipping'}
              </span>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex-shrink-0 border border-outline-variant/40 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[40px] text-primary/60" aria-hidden="true">
=======
        {/* Vehicle Stats Summary (Bento Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Main Info Card (Spans 2 columns) */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex gap-6 items-center relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="w-24 h-24 rounded-2xl bg-blue-50 flex-shrink-0 border border-blue-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[48px]">
>>>>>>> 7a041c7 (maintenance risks)
                {vehicle.vehicle_type === 'Light Van' ? 'directions_car' : 'local_shipping'}
              </span>
            </div>
            <div>
<<<<<<< HEAD
              <h3 className="font-black text-[18px] text-primary">{vehicle.manufacturer} {vehicle.model}</h3>
              <p className="text-[12px] text-on-surface-variant mt-1">
                Branch: <span className="font-semibold text-on-surface">{vehicle.branch_id}</span>
                {vehicle.manufacturing_year && ` • Year: ${vehicle.manufacturing_year}`}
=======
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
                Branch ID: {vehicle.branch_id.substring(0,8)}... • Year: {vehicle.manufacturing_year || 'N/A'}
>>>>>>> 7a041c7 (maintenance risks)
              </p>
              <p className="text-[12px] text-on-surface-variant mt-0.5">Type: {vehicle.vehicle_type}</p>
            </div>
          </div>

<<<<<<< HEAD
          {/* Odometer */}
          <div className="bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm hover:shadow-md transition-all card-hover animate-fade-in-up">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Odometer</span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">speed</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-black text-[28px] text-primary leading-none">
                {(vehicle.current_mileage / 1000).toFixed(1)}k
=======
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
>>>>>>> 7a041c7 (maintenance risks)
              </span>
              <p className="text-[11px] text-on-surface-variant mt-1">{vehicle.current_mileage.toLocaleString()} mi total</p>
            </div>
          </div>

<<<<<<< HEAD
          {/* Total Spend */}
          <div className="bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm hover:shadow-md transition-all card-hover animate-fade-in-up">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Spent</span>
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-green-600" aria-hidden="true">payments</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-black text-[24px] text-primary leading-none">${totalSpend.toFixed(0)}</span>
              <p className="text-[11px] text-on-surface-variant mt-1">across {serviceRecords.length} service{serviceRecords.length !== 1 ? 's' : ''}</p>
=======
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
>>>>>>> 7a041c7 (maintenance risks)
            </div>
          </div>
        </section>

<<<<<<< HEAD
        {/* Service History */}
        <div className="flex justify-between items-end mb-2 border-b border-outline-variant/40 pb-4 animate-fade-in-up">
          <div>
            <h3 className="font-bold text-[17px] text-primary">Service History</h3>
            <p className="text-[12px] text-on-surface-variant mt-0.5">Chronological log of maintenance on this asset.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert(`Exported maintenance sheet for ${vehicle.vehicle_number}`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/60 rounded-xl text-[12px] font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer btn-scale focus-ring"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">download</span>
              Export
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative pl-4 md:pl-8 space-y-4">
          {/* Vertical line */}
          {serviceRecords.length > 1 && (
            <div className="absolute left-[18px] md:left-[26px] top-5 bottom-5 w-0.5 bg-outline-variant/50 pointer-events-none" aria-hidden="true" />
          )}

          {serviceRecords.length > 0 ? (
            serviceRecords.map((record, idx) => {
              const isMajor = Number(record.total_cost) > 500;
              return (
                <div
                  key={record.id}
                  className="relative pl-12 group animate-fade-in-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-[10px] md:left-[18px] top-5 w-4 h-4 rounded-full border-[3px] border-white shadow-md z-10 group-hover:scale-125 transition-all duration-200 ${
                      isMajor ? 'bg-error' : 'bg-surface-tint'
                    }`}
                    aria-hidden="true"
                  />

                  <div className="bg-white border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all card-hover relative overflow-hidden">
                    {/* Left accent */}
                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${isMajor ? 'bg-error' : 'bg-primary'}`} aria-hidden="true" />

                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${isMajor ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'}`}>
                            {isMajor ? 'Major Repair' : 'Routine Maintenance'}
                          </span>
                          <span className="font-mono text-[11px] text-on-surface-variant">{record.service_date}</span>
                        </div>
                        <h4 className="font-bold text-[15px] text-primary">{record.service_type}</h4>
                        <p className="text-[12.5px] text-on-surface-variant mt-1 leading-relaxed">{record.description || 'No description provided.'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-black text-[22px] text-primary block">${Number(record.total_cost).toFixed(2)}</span>
                        <Link href={`/service-records/${record.id}`}>
                          <button className="mt-1.5 text-[12px] text-primary hover:underline font-semibold flex items-center gap-1 ml-auto cursor-pointer border-0 bg-transparent focus-ring rounded">
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">receipt_long</span>
                            View Details
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Metadata strip */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 bg-surface-container-low py-3 px-4 rounded-xl border border-outline-variant/30">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Odometer</span>
                        <span className="font-mono text-[13px] font-semibold text-on-surface">{record.current_mileage.toLocaleString()} mi</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Parts Changed</span>
                        <span className="text-[12px] text-on-surface truncate block" title={record.parts_changed}>{record.parts_changed || 'None'}</span>
                      </div>
                      {record.next_service_date && (
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Next Service</span>
                          <span className="text-[12px] text-on-surface font-semibold">{new Date(record.next_service_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-outline-variant/60 shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-outline-variant mb-3 block animate-float" aria-hidden="true">build</span>
              <h3 className="font-semibold text-[15px] text-on-surface mb-1">No Service Records Yet</h3>
              <p className="text-[12px] text-on-surface-variant mb-4">Start by creating the first service record for this vehicle.</p>
              <Link href="/service-records/create">
                <button className="text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer btn-scale border-0 shadow-md focus-ring" style={{ background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}>
                  Create Service Record
                </button>
              </Link>
=======
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
                            <p className="text-sm font-medium text-slate-600 mt-2">
                              {record.description}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-lg font-mono font-extrabold text-slate-900 block">
                              ${Number(record.total_cost).toFixed(2)}
                            </span>
                            <Link href={`/service-records/${record.id}`}>
                              <button className="mt-2 text-blue-600 hover:underline text-xs font-bold flex items-center gap-1 ml-auto transition-colors cursor-pointer">
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
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">verified_user</span>
                Compliance & Documents
              </h3>
              
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
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1">
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
              <button className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                Upload Document
              </button>
>>>>>>> 7a041c7 (maintenance risks)
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
    </LayoutWrapper>
  );
}
