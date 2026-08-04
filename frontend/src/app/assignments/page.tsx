'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';
import Footer from '@/components/Footer';
import { api } from '@/services/api';

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Active' | 'Completed' | 'Cancelled' | ''>('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      const data = await api.assignments.getAll(params);
      setAssignments(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!api.auth.isAuthenticated()) { router.push('/login'); return; }
    const currentUser = api.auth.getLocalUser();
    if (!currentUser || !['Admin', 'Fleet Manager', 'Manager'].includes(currentUser.role)) {
      router.push('/dashboard');
      return;
    }
    fetchAssignments();
  }, [filterStatus, router]);

  const handleReturn = async (id: string) => {
    if (!confirm('Mark this vehicle as returned?')) return;
    setActionLoading(id);
    try {
      await api.assignments.returnVehicle(id);
      await fetchAssignments();
    } catch (err: any) {
      alert(err.message || 'Failed to return vehicle.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this assignment?')) return;
    setActionLoading(id);
    try {
      await api.assignments.cancelAssignment(id);
      await fetchAssignments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel assignment.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = assignments.filter(a => {
    const q = searchQuery.toLowerCase();
    return !q || a.driver_name?.toLowerCase().includes(q) || a.vehicle_number?.toLowerCase().includes(q) || a.registration_number?.toLowerCase().includes(q);
  });

  const statusBadge = (status: string) => {
    if (status === 'Active') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'Completed') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900">

        {/* Header */}
        <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="font-bold text-xs text-blue-600 uppercase tracking-wider block mb-1">Fleet Operations</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Assignments</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Track all driver-vehicle assignments and their status.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/assignments/create">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Assign Driver
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back
              </button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            {(['Active', 'Completed', 'Cancelled', ''] as const).map((s) => (
              <button
                key={s || 'all'}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer border-0 ${filterStatus === s ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search by driver or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className="material-symbols-outlined text-[18px]">assignment</span>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {/* Assignments Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-500">Loading assignments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-[56px] text-slate-300 mb-4 block">assignment_late</span>
            <p className="font-bold text-slate-700 mb-1">No assignments found</p>
            <p className="text-sm text-slate-500">Try changing the filter or search query.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                {/* Left accent bar */}
                <div className={`absolute top-0 left-0 w-1 h-full ${assignment.assignment_status === 'Active' ? 'bg-emerald-500' : assignment.assignment_status === 'Completed' ? 'bg-blue-400' : 'bg-rose-400'}`}></div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  {/* Driver & Vehicle Info */}
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                      <span className="material-symbols-outlined text-[26px]">badge</span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusBadge(assignment.assignment_status)}`}>
                          {assignment.assignment_status}
                        </span>
                        {assignment.override_used && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Override Used</span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{assignment.driver_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{assignment.driver_email}</p>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <span className="material-symbols-outlined text-[26px]">local_shipping</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{assignment.vehicle_number}</h3>
                      <p className="text-xs font-mono text-slate-500">{assignment.registration_number}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{assignment.manufacturer} {assignment.model}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-right text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">Assigned by: <span className="font-normal">{assignment.assigned_by_name}</span></p>
                    <p>Start: {new Date(assignment.assignment_date).toLocaleDateString()}</p>
                    {assignment.return_date && <p>Return: {new Date(assignment.return_date).toLocaleDateString()}</p>}
                  </div>

                  {/* Actions */}
                  {assignment.assignment_status === 'Active' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleReturn(assignment.id)}
                        disabled={actionLoading === assignment.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border-0 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {actionLoading === assignment.id ? <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[14px]">assignment_return</span>}
                        Return
                      </button>
                      <button
                        onClick={() => handleCancel(assignment.id)}
                        disabled={actionLoading === assignment.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border-0 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">cancel</span>
                        Cancel
                      </button>
                      <Link href={`/vehicles/${assignment.vehicle_id}`}>
                        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border-0 cursor-pointer transition-colors">
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          View
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div><Footer /></div>
      </div>
    </LayoutWrapper>
  );
}
