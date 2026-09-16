'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { ComplianceDocument, Vehicle } from '@/types';
import Footer from '@/components/footer';

export default function CompliancePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Form State
  const [form, setForm] = useState({
    vehicle_id: '',
    document_type: 'Insurance' as 'Insurance' | 'Inspection' | 'PUC' | 'Fitness Certificate',
    document_number: '',
    expiry_date: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [docsData, vehiclesData] = await Promise.all([
          api.compliance.getAll(),
          api.vehicles.getAll(),
        ]);
        setDocuments(docsData || []);
        setVehicles(vehiclesData || []);
      } catch (err: any) {
        console.error('Error fetching compliance documents:', err);
        setError(err.message || 'Failed to load compliance documents.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess('');
    setError('');

    if (!form.vehicle_id || !form.expiry_date) {
      setError('Please select a vehicle and set an expiry date.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('vehicle_id', form.vehicle_id);
      formData.append('document_type', form.document_type);
      formData.append('document_number', form.document_number);
      formData.append('expiry_date', form.expiry_date);
      if (form.file) {
        formData.append('file', form.file);
      }

      const newDoc = await api.compliance.create(formData);
      setDocuments((prev) => [newDoc, ...prev]);
      setSubmitSuccess('Compliance document successfully uploaded!');
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess('');
        setForm({
          vehicle_id: '',
          document_type: 'Insurance',
          document_number: '',
          expiry_date: '',
          file: null,
        });
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to upload compliance document.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateStatus = (expiryDateStr: string): 'Valid' | 'Expiring Soon' | 'Expired' => {
    if (!expiryDateStr) return 'Valid';
    const expiry = new Date(expiryDateStr).getTime();
    const now = Date.now();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'Expired';
    if (daysLeft <= 30) return 'Expiring Soon';
    return 'Valid';
  };

  const filteredDocs = documents.filter((doc) => {
    const v = vehicles.find((veh) => veh.id === doc.vehicle_id);
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      v?.vehicle_number.toLowerCase().includes(query) ||
      v?.model.toLowerCase().includes(query) ||
      doc.document_type.toLowerCase().includes(query) ||
      (doc.document_number && doc.document_number.toLowerCase().includes(query));

    const matchesType = typeFilter === 'All' || doc.document_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const validCount = documents.filter((d) => calculateStatus(d.expiry_date) === 'Valid').length;
  const expiringCount = documents.filter((d) => calculateStatus(d.expiry_date) === 'Expiring Soon').length;
  const expiredCount = documents.filter((d) => calculateStatus(d.expiry_date) === 'Expired').length;
  const complianceRate = documents.length > 0 ? Math.round((validCount / documents.length) * 100) : 100;

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-semibold text-sm text-slate-600">Loading Compliance Audit Records...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper
      searchPlaceholder="Search document, VIN, or vehicle number..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1 block">
              Legal & Regulatory Oversight
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Compliance Documents
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Insurance, emissions, inspection, and fitness certificates expiry tracking
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Upload Document
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Compliance Rate</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{complianceRate}%</div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Active Assets</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase">Valid Documents</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{validCount}</div>
            <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Fully Compliant</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-amber-600 uppercase">Expiring in 30 Days</span>
            <div className="text-3xl font-black text-amber-600 mt-1">{expiringCount}</div>
            <span className="text-[11px] font-semibold text-amber-600 mt-1 block">Renewal Required</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-rose-600 uppercase">Expired Documents</span>
            <div className="text-3xl font-black text-rose-600 mt-1">{expiredCount}</div>
            <span className="text-[11px] font-semibold text-rose-600 mt-1 block">Critical Alert</span>
          </div>
        </div>

        {/* Document Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900">Document Registry</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Type:</span>
              {['All', 'Insurance', 'Inspection', 'PUC', 'Fitness Certificate'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    typeFilter === t
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Vehicle</th>
                  <th className="p-4">Document Type</th>
                  <th className="p-4">Doc #</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Compliance Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => {
                    const vehicle = vehicles.find((v) => v.id === doc.vehicle_id);
                    const status = calculateStatus(doc.expiry_date);

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[18px]">verified_user</span>
                            </div>
                            <div>
                              <p className="font-mono text-xs font-bold text-slate-900">
                                {vehicle ? vehicle.vehicle_number : 'Vehicle #' + doc.vehicle_id.slice(0, 5)}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium">{vehicle ? vehicle.model : ''}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-bold text-slate-800">
                          {doc.document_type}
                        </td>

                        <td className="p-4 font-mono text-xs font-semibold text-slate-600">
                          {doc.document_number || 'N/A'}
                        </td>

                        <td className="p-4 text-xs font-semibold text-slate-700">
                          {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              status === 'Valid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : status === 'Expiring Soon'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {status}
                          </span>
                        </td>

                        <td className="p-4 pr-6 text-right">
                          {doc.file_url ? (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 justify-end"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              View File
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No File Attachment</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs font-medium text-slate-500">
                      No compliance document records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: UPLOAD COMPLIANCE DOCUMENT */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">upload_file</span>
                  <h3 className="text-lg font-bold text-slate-900">Upload Compliance Record</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {submitSuccess}
                </div>
              )}

              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Select Vehicle *</label>
                  <select
                    value={form.vehicle_id}
                    onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} ({v.manufacturer} {v.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Document Type *</label>
                  <select
                    value={form.document_type}
                    onChange={(e) => setForm({ ...form, document_type: e.target.value as any })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Insurance">Insurance Policy</option>
                    <option value="Inspection">Safety Inspection Certificate</option>
                    <option value="PUC">Emissions / PUC Certificate</option>
                    <option value="Fitness Certificate">Vehicle Fitness Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Document Number</label>
                  <input
                    type="text"
                    value={form.document_number}
                    onChange={(e) => setForm({ ...form, document_number: e.target.value })}
                    placeholder="e.g. INS-9920148-X"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Expiry Date *</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Attach Document File (PDF/Image)</label>
                  <input
                    type="file"
                    onChange={(e) => setForm({ ...form, file: e.target.files ? e.target.files[0] : null })}
                    accept="image/*,application/pdf"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Uploading...' : 'Save Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div><Footer /></div>
      </div>
    </LayoutWrapper>
  );
}
