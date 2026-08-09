'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, User } from '@/types';
import Link from 'next/link';

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Unified Compliance Modal State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'docs' | 'profile' | 'edit'>('docs');
  const [docType, setDocType] = useState('Insurance');
  const [docNumber, setDocNumber] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');

  const [editForm, setEditForm] = useState({
    vehicle_number: '',
    registration_number: '',
    manufacturer: '',
    model: '',
    manufacturing_year: '',
    fuel_type: 'Diesel',
    current_mileage: '',
    status: 'Available'
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  useEffect(() => {
    if (selectedVehicleId) {
      const selV = vehicles.find(v => v.id === selectedVehicleId);
      if (selV) {
        setEditForm({
          vehicle_number: selV.vehicle_number || '',
          registration_number: selV.registration_number || '',
          manufacturer: selV.manufacturer || '',
          model: selV.model || '',
          manufacturing_year: (selV.manufacturing_year || (selV as any).year || '').toString(),
          fuel_type: selV.fuel_type || 'Diesel',
          current_mileage: (selV.current_mileage || 0).toString(),
          status: selV.status || 'Available'
        });
        setEditSuccessMsg('');
        setEditErrorMsg('');
      }
    }
  }, [selectedVehicleId, vehicles]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    setSavingEdit(true);
    setEditSuccessMsg('');
    setEditErrorMsg('');

    try {
      const targetV = vehicles.find(v => v.id === selectedVehicleId);
      await api.vehicles.update(selectedVehicleId, {
        ...editForm,
        manufacturing_year: editForm.manufacturing_year ? parseInt(editForm.manufacturing_year, 10) : undefined,
        current_mileage: editForm.current_mileage ? parseInt(editForm.current_mileage, 10) : 0,
        branch_id: (targetV as any)?.branch_id || (targetV as any)?.branch?.id
      } as any);

      setEditSuccessMsg('Vehicle details updated successfully!');
      await fetchVehicles();
    } catch (err: any) {
      setEditErrorMsg(err.message || 'Failed to update vehicle details.');
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = api.auth.getLocalUser();
    if (user?.role !== 'Fleet Manager' && user?.role !== 'Manager' && user?.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }

    fetchVehicles();
  }, [router]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const [vData, uData, aData, cData] = await Promise.all([
        api.vehicles.getAll(),
        api.auth.getUsers().catch(() => []),
        api.assignments?.getAll?.() || Promise.resolve([]),
        api.compliance.getAll().catch(() => [])
      ]);
      setVehicles(vData || []);
      setUsers(uData || []);
      setAssignments(aData || []);
      setComplianceDocs(cData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    setDeletingId(id);
    try {
      await api.vehicles.delete(id);
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteComplianceDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.compliance.delete(docId);
      setComplianceDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const handleAddCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docExpiry || !docType || !selectedVehicleId) return;
    setSubmittingDoc(true);
    try {
      const formData = new FormData();
      formData.append('vehicle_id', selectedVehicleId);
      formData.append('document_type', docType);
      formData.append('document_number', docNumber);
      formData.append('expiry_date', docExpiry);
      formData.append('status', 'Valid');
      if (docFile) {
        formData.append('file', docFile);
      }
      
      const addedDoc = await api.compliance.create(formData);
      
      alert('Compliance document uploaded & replaced successfully!');
      
      // Update local state by discarding old document of the same document_type for this vehicle
      setComplianceDocs(prev => [
        ...prev.filter(d => !(d.vehicle_id === selectedVehicleId && d.document_type === docType)),
        addedDoc
      ]);
      setDocType('Insurance');
      setDocNumber('');
      setDocExpiry('');
      setDocFile(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingDoc(false);
    }
  };

  const now = new Date();

  // Extract unique branches for filter dropdown
  const uniqueBranches = Array.from(new Set(vehicles.map(v => (v as any).branch_name || (v as any).branch || 'Main Branch').filter(Boolean)));

  const filteredVehicles = vehicles.filter(vehicle => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      vehicle.vehicle_number.toLowerCase().includes(q) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(q)) ||
      (vehicle.manufacturer && vehicle.manufacturer.toLowerCase().includes(q));
    const vehicleBranch = (vehicle as any).branch_name || (vehicle as any).branch || 'Main Branch';
    const matchesBranch = branchFilter === 'ALL' || vehicleBranch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
        <div className="flex justify-between items-center border-b pb-4 border-slate-200">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Vehicle Management</h2>
            <p className="text-sm text-slate-500 mt-1">Manage fleet assets, update details, and monitor status.</p>
          </div>
          <Link href="/vehicles/create">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Register Vehicle
            </button>
          </Link>
        </div>
        
        {error && <div className="text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 text-sm font-bold">{error}</div>}

        {/* Filter Controls: Search & Branch Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search by license plate, make, or model..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider shrink-0">Filter Branch:</span>
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Branches</option>
              {uniqueBranches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            No vehicles match the selected criteria.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Vehicle Number</th>
                    <th className="px-6 py-4">Model & Year</th>
                    <th className="px-6 py-4">Mileage</th>
                    <th className="px-6 py-4">Current Driver</th>
                    <th className="px-6 py-4">Compliance Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVehicles.map(vehicle => {
                    const assignment = assignments.find(a => a.vehicle_id === vehicle.id && (a.assignment_status === 'Active' || a.status === 'Active'));
                    const driverObj = users.find(u => u.id === assignment?.driver_id);
                    const driverName = assignment?.driver_name || driverObj?.full_name || driverObj?.username;
                    
                    const vDocs = complianceDocs.filter(d => d.vehicle_id === vehicle.id);
                    const issues = vDocs.filter(d => new Date(d.expiry_date) < now);
                    const mYear = vehicle.manufacturing_year || (vehicle as any).year;

                    return (
                      <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <Link href={`/vehicles/${vehicle.id}`} className="hover:text-blue-600 transition-colors">
                            {vehicle.vehicle_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4">{vehicle.model} {mYear ? `(${mYear})` : ''}</td>
                        <td className="px-6 py-4 font-mono">{vehicle.current_mileage?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4">
                          {driverName ? (
                            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg text-xs border border-blue-200">
                              <span className="material-symbols-outlined text-[14px]">person</span>
                              {driverName}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium italic text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {issues.length > 0 ? (
                            <span className="text-red-600 text-xs font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              {issues.length} Expired
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Compliant
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            onClick={() => { setSelectedVehicleId(vehicle.id); setModalTab('docs'); }}
                            className="text-blue-600 font-bold hover:underline text-[13px] transition-colors cursor-pointer"
                          >
                            Docs
                          </button>
                          <Link 
                            href={`/vehicles/${vehicle.id}`}
                            className="text-emerald-600 font-bold hover:underline text-[13px] transition-colors cursor-pointer inline-block"
                          >
                            Profile
                          </Link>
                          <button 
                            onClick={() => { setSelectedVehicleId(vehicle.id); setModalTab('edit'); }}
                            className="text-amber-600 font-bold hover:underline text-[13px] transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(vehicle.id)} 
                            disabled={deletingId === vehicle.id}
                            className="text-red-600 font-bold hover:underline text-[13px] transition-colors disabled:opacity-50" 
                          >
                            {deletingId === vehicle.id ? 'Deleting...' : 'Delete'}
                          </button>
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

      {/* Unified Quick Compliance Manager Modal */}
      {selectedVehicleId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Manage Compliance</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Vehicle: {vehicles.find(v => v.id === selectedVehicleId)?.vehicle_number}
                </p>
              </div>
              <button onClick={() => setSelectedVehicleId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-4">
              <button 
                onClick={() => setModalTab('docs')}
                className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'docs' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Compliance Documents
              </button>
              <button 
                onClick={() => setModalTab('profile')}
                className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'profile' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Vehicle Profile
              </button>
              <button 
                onClick={() => setModalTab('edit')}
                className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'edit' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Edit Details
              </button>
            </div>
            
            {modalTab === 'docs' && (
              <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Existing Documents List */}
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-500">description</span>
                    Current Documents
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {complianceDocs.filter(d => d.vehicle_id === selectedVehicleId).length > 0 ? (
                      complianceDocs.filter(d => d.vehicle_id === selectedVehicleId).map(doc => {
                        const isExpired = new Date(doc.expiry_date) < new Date();
                        
                        const getDocImageUrl = (type: string, file_url?: string) => {
                          if (file_url) {
                            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api').replace('/api', '');
                            return `${baseUrl}${file_url}`;
                          }
                          const mapping: Record<string, string> = {
                            'Insurance': 'C:\\Users\\PRATHAMESH V SHENOY\\.gemini\\antigravity\\brain\\1522b031-1cca-4557-aab1-e1b9efc350b1\\insurance_doc_1785678590681.png',
                            'PUC': 'C:\\Users\\PRATHAMESH V SHENOY\\.gemini\\antigravity\\brain\\1522b031-1cca-4557-aab1-e1b9efc350b1\\emissions_puc_1785678646917.png',
                            'Fitness Certificate': 'C:\\Users\\PRATHAMESH V SHENOY\\.gemini\\antigravity\\brain\\1522b031-1cca-4557-aab1-e1b9efc350b1\\fitness_cert_1785678658469.png'
                          };
                          const path = mapping[type] || mapping['Insurance'];
                          return `/api/image?path=${encodeURIComponent(path)}`;
                        };

                        return (
                          <div key={doc.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                            <div className="h-32 w-full relative bg-slate-100 overflow-hidden border-b border-slate-100">
                              <img 
                                src={getDocImageUrl(doc.document_type, doc.file_url)} 
                                alt={doc.document_type} 
                                onClick={() => setViewingImage(getDocImageUrl(doc.document_type, doc.file_url))}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" 
                              />
                              <div className="absolute top-2 right-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm ${isExpired ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                  {isExpired ? 'Expired' : 'Valid'}
                                </span>
                              </div>
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-slate-900 text-base">{doc.document_type}</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-500 font-mono mb-3">No: {doc.document_number || 'N/A'}</p>
                              
                              <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Expires On</span>
                                <span className={`text-sm font-bold ${isExpired ? 'text-rose-600' : 'text-slate-700'}`}>
                                  {new Date(doc.expiry_date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-1 sm:col-span-2 p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-sm font-medium text-slate-500">
                        <span className="material-symbols-outlined text-slate-400 text-4xl mb-2 block">inventory_2</span>
                        No compliance documents uploaded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Add New Document Form */}
                <div className="lg:col-span-1">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 sticky top-0">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">add_circle</span>
                      Upload Document
                    </h4>
                    <form onSubmit={handleAddCompliance} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                        <select value={docType} onChange={e => setDocType(e.target.value)} required className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
                          <option value="Insurance">Insurance</option>
                          <option value="PUC">Emissions / PUC</option>
                          <option value="Fitness Certificate">Fitness Certificate / Safety</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Document Number</label>
                        <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="e.g. POL-123" className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date <span className="text-red-500">*</span></label>
                        <input type="date" required value={docExpiry} onChange={e => setDocExpiry(e.target.value)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Document Image</label>
                        <input type="file" accept="image/*" onChange={e => setDocFile(e.target.files ? e.target.files[0] : null)} className="w-full border border-slate-300 rounded-xl p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                      <div className="pt-2">
                        <button type="submit" disabled={submittingDoc} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md cursor-pointer flex justify-center items-center gap-2">
                          {submittingDoc ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">upload</span>
                              Save Document
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Profile and Edit Views Handling */}
            {modalTab === 'profile' && (
              <div className="flex-1 overflow-y-auto p-8">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h4 className="text-lg font-black text-slate-900 mb-4 border-b border-slate-200 pb-2">Vehicle Profile</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Manufacturer</p>
                      <p className="font-semibold text-slate-800">{vehicles.find(v => v.id === selectedVehicleId)?.manufacturer}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Model</p>
                      <p className="font-semibold text-slate-800">{vehicles.find(v => v.id === selectedVehicleId)?.model}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Year</p>
                      <p className="font-semibold text-slate-800">{vehicles.find(v => v.id === selectedVehicleId)?.manufacturing_year}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Fuel Type</p>
                      <p className="font-semibold text-slate-800">{vehicles.find(v => v.id === selectedVehicleId)?.fuel_type}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Mileage</p>
                      <p className="font-semibold text-slate-800">{vehicles.find(v => v.id === selectedVehicleId)?.current_mileage} km</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                      <p className="font-semibold text-slate-800">{vehicles.find(v => v.id === selectedVehicleId)?.status}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                    <Link 
                      href={`/vehicles/${selectedVehicleId}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-xs"
                    >
                      <span>Go to Full Profile Page</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {modalTab === 'edit' && (
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
                {/* Yellow Amber Notice Banner - Fixed Width & Layout */}
                <div className="w-full max-w-3xl mx-auto mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-amber-600 text-3xl">construction</span>
                  </div>
                  <h4 className="w-full text-lg font-extrabold text-slate-900 mb-1 text-center block">Quick Edit Mode</h4>
                  <p className="w-full text-sm font-medium text-amber-900/90 text-center leading-relaxed mb-4 block" style={{ whiteSpace: 'normal', wordBreak: 'normal', width: '100%' }}>
                    You can update the basic details for <span className="font-bold text-slate-900">{vehicles.find(v => v.id === selectedVehicleId)?.vehicle_number}</span> right here.
                  </p>
                  <button 
                    type="button"
                    onClick={() => setModalTab('profile')} 
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border-0 inline-block"
                  >
                    Back to Profile
                  </button>
                </div>

                <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <span className="material-symbols-outlined text-[22px]">edit_note</span>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">Edit Vehicle Specification</h4>
                      <p className="text-xs font-medium text-slate-500">Update registration, model year, status, or mileage parameters.</p>
                    </div>
                  </div>

                  {editSuccessMsg && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      {editSuccessMsg}
                    </div>
                  )}

                  {editErrorMsg && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      {editErrorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveEdit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Vehicle Number</label>
                        <input
                          type="text"
                          required
                          value={editForm.vehicle_number}
                          onChange={e => setEditForm({ ...editForm, vehicle_number: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Registration Number / VIN</label>
                        <input
                          type="text"
                          required
                          value={editForm.registration_number}
                          onChange={e => setEditForm({ ...editForm, registration_number: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Manufacturer</label>
                        <input
                          type="text"
                          required
                          value={editForm.manufacturer}
                          onChange={e => setEditForm({ ...editForm, manufacturer: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Model</label>
                        <input
                          type="text"
                          required
                          value={editForm.model}
                          onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Manufacturing Year</label>
                        <input
                          type="number"
                          min="1990"
                          max={new Date().getFullYear()}
                          value={editForm.manufacturing_year}
                          onChange={e => setEditForm({ ...editForm, manufacturing_year: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Fuel Type</label>
                        <select
                          value={editForm.fuel_type}
                          onChange={e => setEditForm({ ...editForm, fuel_type: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                        >
                          <option value="Diesel">Diesel</option>
                          <option value="Petrol">Petrol</option>
                          <option value="EV">Electric (EV)</option>
                          <option value="CNG">CNG</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Current Mileage (km)</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.current_mileage}
                          onChange={e => setEditForm({ ...editForm, current_mileage: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Operational Status</label>
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="Available">Available</option>
                          <option value="Assigned">Assigned</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setModalTab('profile')}
                        className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingEdit}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 transition-colors cursor-pointer border-0 flex items-center gap-2"
                      >
                        {savingEdit ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">save</span>
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Image Viewer Overlay */}
      {viewingImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setViewingImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={viewingImage} alt="Document" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </LayoutWrapper>
  );
}
