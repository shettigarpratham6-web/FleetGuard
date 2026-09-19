'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { User, Vehicle, ServiceRecord } from '@/types';
import Link from 'next/link';

interface AttentionItem {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  manufacturer: string;
  model: string;
  status: string;
  issueType: 'Insurance' | 'PUC' | 'Fitness Certificate' | 'Service';
  issueTitle: string;
  expiryDate?: string;
  daysDiff: number;
  isExpired: boolean;
  assignedDriverName?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [historicalServices, setHistoricalServices] = useState<any[]>([]);
  const [liveServices, setLiveServices] = useState<any[]>([]);
  const [serviceQueue, setServiceQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  // Active Tab for Action Feed
  const [activeTab, setActiveTab] = useState<'ALL' | 'INSURANCE' | 'INSPECTION' | 'SERVICE'>('ALL');

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = api.auth.getLocalUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    setUserRole(currentUser.role);

    if (!['Admin', 'Fleet Manager', 'Manager'].includes(currentUser.role)) {
      if (currentUser.role === 'Service Center') {
        router.push('/mechanic');
      } else {
        router.push('/driver');
      }
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehiclesData, usersData, docsData, assignmentsData, historicalServicesData, serviceQueueData, liveServicesData] = await Promise.all([
          api.vehicles.getAll(),
          api.auth.getUsers(),
          api.compliance.getAll().catch(() => []),
          api.assignments?.getAll?.() || Promise.resolve([]),
          api.historicalServices?.getAll?.().catch(() => []) || Promise.resolve([]),
          api.serviceQueue?.getAll?.().catch(() => []) || Promise.resolve([]),
          api.services?.getAll?.().catch(() => []) || Promise.resolve([])
        ]);

        setVehicles(vehiclesData || []);
        setUsers(usersData || []);
        setComplianceDocs(docsData || []);
        setAssignments(assignmentsData || []);
        setHistoricalServices(Array.isArray(historicalServicesData) ? historicalServicesData : (historicalServicesData as any)?.services || (historicalServicesData as any)?.records || []);
        setServiceQueue(Array.isArray(serviceQueueData) ? serviceQueueData : (serviceQueueData as any)?.queue || []);
        setLiveServices(Array.isArray(liveServicesData) ? liveServicesData : (liveServicesData as any)?.records || []);
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        if (err.message?.includes('Authentication') || err.message?.includes('token') || err.message?.includes('401') || err.message?.includes('expired')) {
          api.auth.logout();
          router.push('/login');
          return;
        }
        setError(err.message || 'Failed to retrieve real-time data from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-semibold text-xs text-slate-600">Loading Dashboard...</p>
        </div>
      </LayoutWrapper>
    );
  }

  // KPI Calculations
  const totalVehicles = vehicles.length;
  const activeAssignments = assignments.filter(a => a.assignment_status === 'Active' || a.status === 'Active');
  const assignedVehicles = activeAssignments.length;
  const unassignedVehicles = totalVehicles - assignedVehicles;

  const drivers = users.filter(u => u.role === 'Driver');

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Construct Attention Items Feed
  const attentionItems: AttentionItem[] = [];

  // 1. Compliance Docs
  complianceDocs.forEach(doc => {
    const expDate = new Date(doc.expiry_date);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const v = vehicles.find(veh => veh.id === doc.vehicle_id);
    if (!v) return;

    const currentAssignment = activeAssignments.find(a => a.vehicle_id === v.id);
    const driverObj = currentAssignment ? users.find(u => u.id === currentAssignment.driver_id) : null;

    if (daysDiff <= 30) {
      const isExp = daysDiff < 0;
      let issueType: AttentionItem['issueType'] = 'Insurance';
      if (doc.document_type === 'PUC') issueType = 'PUC';
      else if (doc.document_type === 'Fitness Certificate' || doc.document_type === 'Inspection') issueType = 'Fitness Certificate';

      attentionItems.push({
        id: doc.id || `doc-${v.id}-${doc.document_type}`,
        vehicleId: v.id,
        vehicleNumber: v.vehicle_number,
        manufacturer: v.manufacturer || '',
        model: v.model || '',
        status: v.status,
        issueType,
        issueTitle: `${doc.document_type} ${isExp ? 'Expired' : 'Expiring Soon'}`,
        expiryDate: doc.expiry_date,
        daysDiff,
        isExpired: isExp,
        assignedDriverName: driverObj?.full_name || (currentAssignment ? currentAssignment.driver_name : undefined)
      });
    }
  });

  // 2. Service/Maintenance Vehicles
  vehicles.forEach(v => {
    const currentAssignment = activeAssignments.find(a => a.vehicle_id === v.id);
    const driverObj = currentAssignment ? users.find(u => u.id === currentAssignment.driver_id) : null;

    if (v.status === 'Maintenance') {
      if (!attentionItems.some(i => i.vehicleId === v.id && i.issueType === 'Service')) {
        attentionItems.push({
          id: `maint-${v.id}`,
          vehicleId: v.id,
          vehicleNumber: v.vehicle_number,
          manufacturer: v.manufacturer || '',
          model: v.model || '',
          status: v.status,
          issueType: 'Service',
          issueTitle: 'Under Maintenance',
          daysDiff: -1,
          isExpired: true,
          assignedDriverName: driverObj?.full_name || (currentAssignment ? currentAssignment.driver_name : undefined)
        });
      }
    }
  });

  attentionItems.sort((a, b) => a.daysDiff - b.daysDiff);

  const filteredAttentionItems = attentionItems.filter(item => {
    if (activeTab === 'INSURANCE') return item.issueType === 'Insurance' || item.issueType === 'PUC';
    if (activeTab === 'INSPECTION') return item.issueType === 'Fitness Certificate' || item.issueType === 'PUC';
    if (activeTab === 'SERVICE') return item.issueType === 'Service';
    return true;
  });

  const getRecordCost = (record: any) => {
    if (record.total_cost !== undefined && record.total_cost !== null && !isNaN(Number(record.total_cost))) {
      return Number(record.total_cost);
    }
    if (record.cost !== undefined && record.cost !== null && !isNaN(Number(record.cost))) {
      return Number(record.cost);
    }
    const labour = Number(record.labour_cost) || 0;
    const parts = Number(record.parts_cost) || 0;
    return labour + parts;
  };

  const serviceRecordMap = new Map<string, any>();
  [...liveServices, ...historicalServices].forEach((r, idx) => {
    const key = r.id || `idx-${idx}`;
    if (!serviceRecordMap.has(key)) {
      serviceRecordMap.set(key, r);
    }
  });
  const allServiceRecords = Array.from(serviceRecordMap.values());

  const totalExpiredDocs = complianceDocs.filter(d => new Date(d.expiry_date) < now).length;
  const totalExpiringSoon = complianceDocs.filter(d => {
    const exp = new Date(d.expiry_date);
    return exp >= now && exp <= next30Days;
  }).length;
  const vehiclesInMaintenanceCount = vehicles.filter(v => v.status === 'Maintenance').length;
  const totalMaintenanceCost = allServiceRecords.reduce((sum, r) => sum + getRecordCost(r), 0);

  const compliantVehiclesCount = vehicles.filter(v => {
    const vDocs = complianceDocs.filter(d => d.vehicle_id === v.id);
    const isExpired = vDocs.some(d => new Date(d.expiry_date) < now);
    return !isExpired && v.status !== 'Maintenance';
  }).length;
  const complianceRate = totalVehicles > 0 ? ((compliantVehiclesCount / totalVehicles) * 100).toFixed(1) : '100.0';

  const adminsCount = users.filter(u => u.role === 'Admin').length;
  const managersCount = users.filter(u => u.role === 'Fleet Manager' || u.role === 'Manager').length;
  const driversCount = users.filter(u => u.role === 'Driver').length;
  const mechanicsCount = users.filter(u => u.role === 'Service Center' || (u.role as string) === 'Mechanic').length;

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">
        
        {/* Concise Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">Fleet Control Center</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {userRole === 'Admin' ? 'Admin Overview' : 'Fleet Manager Dashboard'}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/assignments/create">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all border-0 cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Assign Vehicle
              </button>
            </Link>
            <Link href="/vehicles/create">
              <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Register Vehicle
              </button>
            </Link>
            <Link href="/service-queue">
              <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">build</span>
                Log Service
              </button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* DASHBOARD CONTENT */}
        {userRole === 'Admin' ? (
          /* ==================== ADMIN DASHBOARD ==================== */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">Compliance Rate</p>
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900">{complianceRate}%</span>
                  <span className="text-xs font-semibold text-emerald-600 ml-2">Compliant</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[11px] font-black text-rose-600 uppercase tracking-wider">Expired Docs</p>
                  <span className="material-symbols-outlined text-rose-600 text-[18px]">error</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900">{totalExpiredDocs}</span>
                  <span className="text-xs font-semibold text-rose-600 ml-2">Overdue</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[11px] font-black text-amber-600 uppercase tracking-wider">Expiring 30 Days</p>
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">schedule</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900">{totalExpiringSoon}</span>
                  <span className="text-xs font-semibold text-amber-700 ml-2">Warnings</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">Total Fleet Spend</p>
                  <span className="material-symbols-outlined text-indigo-600 text-[18px]">payments</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900">${totalMaintenanceCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Admin Audit Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-base font-black text-slate-900">Fleet Compliance Audit</h3>
                <Link href="/analytics" className="text-xs font-bold text-blue-600 hover:underline">
                  View Full Analytics
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Assigned Operator</th>
                      <th className="px-4 py-3 text-right">Maintenance Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {vehicles.map((v) => {
                      const vDocs = complianceDocs.filter(d => d.vehicle_id === v.id);
                      const isExpired = vDocs.some(d => new Date(d.expiry_date) < now);
                      const assignment = activeAssignments.find(a => a.vehicle_id === v.id);
                      const driver = assignment ? users.find(u => u.id === assignment.driver_id) : null;
                      const driverName = assignment?.driver_name || driver?.full_name || null;
                      const vSpend = allServiceRecords.filter(s => s.vehicle_id === v.id).reduce((sum, r) => sum + getRecordCost(r), 0);

                      const isAssigned = Boolean(assignment && driverName);
                      let displayStatus = isExpired ? 'EXPIRED' : (isAssigned ? 'ASSIGNED' : ((v.status as string).toUpperCase() === 'ASSIGNED' ? 'AVAILABLE' : v.status));

                      return (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-extrabold text-slate-900">
                            {v.vehicle_number} <span className="text-slate-400 font-normal">({v.manufacturer} {v.model})</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isExpired || v.status === 'Maintenance'
                                ? 'bg-rose-100 text-rose-800'
                                : isAssigned
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {driverName || 'Unassigned'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                            ${vSpend.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ==================== FLEET MANAGER DASHBOARD ==================== */
          <div className="space-y-6">
            {/* 4 Core Clean KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Total Fleet</p>
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">directions_car</span>
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900">{totalVehicles}</span>
                  <span className="text-xs font-bold text-slate-500 ml-2">Vehicles</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-1">{assignedVehicles} Assigned · {unassignedVehicles} Unassigned</p>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[11px] font-black text-rose-600 uppercase tracking-wider">Expired Docs</p>
                  <span className="material-symbols-outlined text-rose-600 text-[18px]">warning</span>
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900">{totalExpiredDocs}</span>
                  <span className="text-xs font-bold text-rose-600 ml-2">Overdue</span>
                </div>
                <p className="text-[11px] font-bold text-rose-600 mt-1">Requires immediate renewal</p>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[11px] font-black text-amber-600 uppercase tracking-wider">Expiring Soon</p>
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">schedule</span>
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900">{totalExpiringSoon}</span>
                  <span className="text-xs font-bold text-amber-700 ml-2">Warnings</span>
                </div>
                <p className="text-[11px] font-bold text-amber-700 mt-1">Expiring within 30 days</p>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-blue-200 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider">In Maintenance</p>
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">build</span>
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900">{vehiclesInMaintenanceCount}</span>
                  <span className="text-xs font-bold text-blue-600 ml-2">In Shop</span>
                </div>
                <p className="text-[11px] font-bold text-blue-600 mt-1">Spend: ${totalMaintenanceCost.toLocaleString()}</p>
              </div>
            </div>

            {/* Concise Vehicles Requiring Attention Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">notification_important</span>
                  <h3 className="text-base font-black text-slate-900">Vehicles Requiring Action</h3>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('ALL')}
                    className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all border-0 cursor-pointer ${activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All ({attentionItems.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('INSURANCE')}
                    className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all border-0 cursor-pointer ${activeTab === 'INSURANCE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Insurance & PUC
                  </button>
                  <button
                    onClick={() => setActiveTab('INSPECTION')}
                    className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all border-0 cursor-pointer ${activeTab === 'INSPECTION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Inspection
                  </button>
                  <button
                    onClick={() => setActiveTab('SERVICE')}
                    className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all border-0 cursor-pointer ${activeTab === 'SERVICE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Service
                  </button>
                </div>
              </div>

              {filteredAttentionItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50">
                  <span className="material-symbols-outlined text-3xl text-emerald-500 mb-1 block">verified</span>
                  <p className="font-extrabold text-slate-800 text-sm">All Vehicles Clear</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Vehicle Plate</th>
                        <th className="px-4 py-3">Issue</th>
                        <th className="px-4 py-3">Expiry Timeline</th>
                        <th className="px-4 py-3">Current Driver</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredAttentionItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <Link href="/vehicles" className="font-extrabold text-slate-900 hover:text-blue-600 transition-colors font-mono">
                              {item.vehicleNumber}
                            </Link>
                            <p className="text-[11px] text-slate-500 font-medium">{item.manufacturer} {item.model}</p>
                          </td>

                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black border ${
                              item.isExpired ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.issueTitle}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono font-bold">
                            {item.daysDiff < 0 ? (
                              <span className="text-rose-600">Overdue {Math.abs(item.daysDiff)}d</span>
                            ) : item.daysDiff === 0 ? (
                              <span className="text-amber-600">Expires Today</span>
                            ) : (
                              <span className="text-amber-700">Due in {item.daysDiff}d</span>
                            )}
                          </td>

                          <td className="px-4 py-3 font-bold text-slate-800">
                            {item.assignedDriverName || <span className="text-slate-400 font-normal italic">Unassigned</span>}
                          </td>

                          <td className="px-4 py-3 text-right space-x-1.5">
                            <Link href="/vehicles">
                              <button className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer">
                                Renew
                              </button>
                            </Link>
                            <Link href="/assignments/create">
                              <button className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer">
                                Assign
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </LayoutWrapper>
  );
}