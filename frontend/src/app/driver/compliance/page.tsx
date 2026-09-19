'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle } from '@/types';
import Link from 'next/link';

interface ComplianceDoc {
  id: string;
  vehicle_id: string;
  document_type: string;
  document_number?: string;
  issue_date?: string;
  expiry_date: string;
  file_url?: string;
  notes?: string;
}

export default function DriverCompliancePage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [complianceDocs, setComplianceDocs] = useState<ComplianceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDoc | null>(null);

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
          const [v, docs] = await Promise.all([
            api.vehicles.getById(activeAssignment.vehicle_id),
            api.compliance.getAll().catch(() => [])
          ]);

          setVehicle(v);
          setComplianceDocs((docs || []).filter((d: any) => d.vehicle_id === v.id));
        }
      } catch (err) {
        console.error('Failed to load driver compliance documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center h-[65vh] space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Retrieving Vehicle Compliance Certificates...</p>
        </div>
      </LayoutWrapper>
    );
  }

  if (!vehicle) {
    return (
      <LayoutWrapper>
        <div className="p-6 md:p-12 max-w-4xl mx-auto bg-slate-50 min-h-screen flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-slate-400">verified_user</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">No Assigned Vehicle Found</h2>
          <p className="text-slate-500 max-w-md mb-6">
            Compliance certificates are tied to your assigned vehicle. Please contact your Fleet Manager to assign a vehicle.
          </p>
          <Link
            href="/driver"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Return To Driver Console
          </Link>
        </div>
      </LayoutWrapper>
    );
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Standard document audit categories
  const getDocByType = (type: string) => {
    return complianceDocs.find(d => d.document_type.toLowerCase().includes(type.toLowerCase()));
  };

  const insuranceDoc = getDocByType('insurance');
  const rcDoc = getDocByType('registration') || getDocByType('rc');
  const pucDoc = getDocByType('pollution') || getDocByType('puc') || getDocByType('emissions');
  const fitnessDoc = getDocByType('fitness') || getDocByType('inspection') || getDocByType('safety');

  const docCategoryList = [
    { title: 'Insurance Policy Certificate', typeKey: 'Insurance', doc: insuranceDoc, reqType: 'Insurance Policy' },
    { title: 'Registration Certificate (RC)', typeKey: 'RC', doc: rcDoc, reqType: 'Vehicle Registration' },
    { title: 'Pollution Under Control (PUC)', typeKey: 'PUC', doc: pucDoc, reqType: 'Emissions Standard' },
    { title: 'Fitness & Safety Inspection', typeKey: 'Fitness', doc: fitnessDoc, reqType: 'Safety Fitness' }
  ];

  const expiredDocs = complianceDocs.filter(d => new Date(d.expiry_date) < now);
  const isCompliant = expiredDocs.length === 0 && complianceDocs.length >= 2 && vehicle.status !== 'Maintenance';

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-extrabold text-[11px] uppercase tracking-wider">
                Compliance Vault
              </span>
              <span className="text-xs font-semibold text-slate-400">• Vehicle Legal Audit</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vehicle Compliance Certificates</h1>
            <p className="text-slate-500 text-sm mt-1">
              Road-legal documents & expiration certificates for assigned vehicle <span className="font-mono font-bold text-slate-900">{vehicle.vehicle_number}</span>
            </p>
          </div>

          <Link
            href="/driver"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all self-start md:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">speed</span>
            Go To Driver Console
          </Link>
        </div>

        {/* Road Legal Status Clearance Banner */}
        <div className={`rounded-2xl shadow-xl overflow-hidden border transition-all duration-300 ${
          !isCompliant
            ? 'bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-white border-rose-800/80'
            : 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 text-white border-emerald-800/80'
        }`}>
          <div className="p-6 md:p-7 relative z-10">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${
                !isCompliant ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              }`}>
                <span className="material-symbols-outlined text-[38px]">{!isCompliant ? 'report' : 'verified_user'}</span>
              </div>
              <div className="flex-1">
                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-2 border shadow-sm ${
                  !isCompliant 
                    ? 'bg-rose-500/25 text-rose-200 border-rose-400/30' 
                    : 'bg-emerald-500/25 text-emerald-200 border-emerald-400/30'
                }`}>
                  {!isCompliant ? 'COMPLIANCE WARNING' : 'ROAD-LEGAL CLEARANCE ACTIVE'}
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                  {!isCompliant ? 'Legal Risk Detected on Assigned Vehicle' : 'All Vehicle Certificates Compliant & Valid'}
                </h2>
                <p className="text-slate-200 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
                  {!isCompliant
                    ? `Assigned vehicle ${vehicle.vehicle_number} has ${expiredDocs.length} expired certificate(s). Do not operate on public highways without valid documentation.`
                    : `Assigned vehicle ${vehicle.vehicle_number} is 100% compliant with government transportation regulations and road safety standards.`}
                </p>
              </div>

              {/* Vehicle Badge */}
              <div className="hidden sm:block bg-black/40 backdrop-blur-md rounded-xl p-3.5 border border-white/20 text-right min-w-[170px]">
                <p className="text-[10px] uppercase font-black text-slate-300 tracking-wider mb-0.5">Assigned Plate</p>
                <p className="text-xl font-black text-white tracking-wider font-mono whitespace-nowrap">{vehicle.vehicle_number}</p>
                <p className="text-xs text-slate-200 font-bold">{vehicle.manufacturer} {vehicle.model}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Vehicle Specifications Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4">Assigned Vehicle Legal Audit</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">License Plate</p>
              <p className="font-extrabold text-blue-700 font-mono text-base whitespace-nowrap">{vehicle.vehicle_number}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Make & Model</p>
              <p className="font-extrabold text-slate-900 text-sm">{vehicle.manufacturer} {vehicle.model}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Registration No</p>
              <p className="font-mono text-xs font-bold text-slate-800 truncate">{vehicle.registration_number || 'N/A'}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Compliance Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mt-1 ${
                isCompliant 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {isCompliant ? 'Compliant' : 'Non-Compliant'}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Primary Compliance Documents Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-lg font-extrabold text-slate-900">Assigned Vehicle Legal Documents</h3>
            <span className="text-xs font-semibold text-slate-500">{complianceDocs.length} Total Documents Managed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {docCategoryList.map((category) => {
              const doc = category.doc;
              if (!doc) {
                return (
                  <div key={category.title} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm opacity-80">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-[20px]">description</span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">{category.title}</h4>
                          <p className="text-xs text-slate-400">{category.reqType}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-300 uppercase">
                        Unregistered
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 italic">No document file registered for this vehicle.</p>
                  </div>
                );
              }

              const expDate = new Date(doc.expiry_date);
              expDate.setHours(0, 0, 0, 0);
              const diffTime = expDate.getTime() - now.getTime();
              const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isExp = daysDiff < 0;
              const isExpSoon = daysDiff >= 0 && daysDiff <= 30;

              return (
                <div 
                  key={doc.id || category.title}
                  className={`bg-white rounded-2xl border p-6 space-y-4 shadow-sm transition-all ${
                    isExp 
                      ? 'border-rose-400 border-l-4 border-l-rose-600 bg-rose-50/30' 
                      : isExpSoon 
                      ? 'border-amber-400 border-l-4 border-l-amber-500 bg-amber-50/30' 
                      : 'border-slate-200 border-l-4 border-l-emerald-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isExp 
                          ? 'bg-rose-100 text-rose-700' 
                          : isExpSoon 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <span className="material-symbols-outlined text-[22px]">
                          {isExp ? 'warning' : 'verified'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">{category.title}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          Doc #: {doc.document_number || 'REG-DOC-' + doc.id.substring(0, 6)}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      isExp 
                        ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                        : isExpSoon 
                        ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {isExp ? 'Expired' : isExpSoon ? 'Expiring Soon' : 'Valid'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</p>
                      <p className="font-mono font-extrabold text-slate-800 mt-0.5">
                        {expDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Days Countdown</p>
                      <p className={`font-mono font-extrabold mt-0.5 ${
                        isExp ? 'text-rose-700' : isExpSoon ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        {isExp ? `Expired ${Math.abs(daysDiff)} days ago` : `${daysDiff} days remaining`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Status: {isExp ? 'Requires Immediate Renewal' : 'Legally Cleared'}
                    </span>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      View Certificate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Guidance Note */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
          <span className="material-symbols-outlined text-blue-600 text-[28px]">info</span>
          <div>
            <h4 className="font-extrabold text-blue-950 text-sm">Need Document Renewal Support?</h4>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              If any compliance document is expired or expiring within 30 days, please notify your Fleet Manager immediately. Operating a vehicle on public roads with expired documents violates state traffic regulations.
            </p>
          </div>
        </div>

        {/* Document Details Modal — Fixed Alignment & Fixed Container Width */}
        {selectedDoc && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fadeIn"
            onClick={() => setSelectedDoc(null)}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-[480px] min-w-[320px] shrink-0 p-6 space-y-5 shadow-2xl border border-slate-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-blue-600">verified</span>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedDoc.document_type} Details</h3>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Document Type:</span>
                    <span className="font-extrabold text-slate-900">{selectedDoc.document_type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Document Number:</span>
                    <span className="font-mono font-extrabold text-slate-800">{selectedDoc.document_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Expiration Date:</span>
                    <span className="font-mono font-black text-slate-900">{new Date(selectedDoc.expiry_date).toLocaleDateString()}</span>
                  </div>
                  {selectedDoc.notes && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 font-bold block mb-1">Notes:</span>
                      <p className="text-slate-700 font-medium leading-relaxed">{selectedDoc.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer border-0"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </LayoutWrapper>
  );
}
