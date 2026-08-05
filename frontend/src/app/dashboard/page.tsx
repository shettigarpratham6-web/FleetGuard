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
  daysDiff: number; // negative if past, positive if future
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
  const [serviceQueue, setServiceQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  // Active Tab for At-A-Glance Action Feed
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
        const [vehiclesData, usersData, docsData, assignmentsData, historicalServicesData, serviceQueueData] = await Promise.all([
          api.vehicles.getAll(),
          api.auth.getUsers(),
          api.compliance.getAll().catch(() => []),
          api.assignments?.getAll?.() || Promise.resolve([]),
          api.historicalServices?.getAll?.().catch(() => []) || Promise.resolve([]),
          api.serviceQueue?.getAll?.().catch(() => []) || Promise.resolve([])
        ]);

        setVehicles(vehiclesData || []);
        setUsers(usersData || []);
        setComplianceDocs(docsData || []);
        setAssignments(assignmentsData || []);
        setHistoricalServices(Array.isArray(historicalServicesData) ? historicalServicesData : (historicalServicesData as any)?.services || []);
        setServiceQueue(Array.isArray(serviceQueueData) ? serviceQueueData : (serviceQueueData as any)?.queue || []);
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
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="font-semibold text-sm text-slate-600 tracking-wide">
            Loading Fleet Manager Dashboard...
          </p>
        </div>
      </LayoutWrapper>
    );
  }

  const isAdmin = userRole === 'Admin';

  // KPI Calculations
  const totalVehicles = vehicles.length;
  const activeAssignments = assignments.filter(a => a.assignment_status === 'Active' || a.status === 'Active');
  const assignedVehicles = activeAssignments.length;
  const unassignedVehicles = totalVehicles - assignedVehicles;

  const drivers = users.filter(u => u.role === 'Driver');
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(u => u.status === 'Active').length;
  const pendingDrivers = drivers.filter(u => u.status === 'Pending').length;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Construct Detailed Attention Items Feed
  const attentionItems: AttentionItem[] = [];

  // 1. Process Compliance Documents
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

  // 2. Process Vehicles Requiring Service or Maintenance
  vehicles.forEach(v => {
    const currentAssignment = activeAssignments.find(a => a.vehicle_id === v.id);
    const driverObj = currentAssignment ? users.find(u => u.id === currentAssignment.driver_id) : null;

    if (v.status === 'Maintenance') {
      // Avoid duplicate if already logged
      if (!attentionItems.some(i => i.vehicleId === v.id && i.issueType === 'Service')) {
        attentionItems.push({
          id: `maint-${v.id}`,
          vehicleId: v.id,
          vehicleNumber: v.vehicle_number,
          manufacturer: v.manufacturer || '',
          model: v.model || '',
          status: v.status,
          issueType: 'Service',
          issueTitle: 'Under Maintenance / Service In Progress',
          daysDiff: -1,
          isExpired: true,
          assignedDriverName: driverObj?.full_name || (currentAssignment ? currentAssignment.driver_name : undefined)
        });
      }
    }
  });

  // Sort by most urgent (most days past expiration first)
  attentionItems.sort((a, b) => a.daysDiff - b.daysDiff);

  // Filtered list based on active tab
  const filteredAttentionItems = attentionItems.filter(item => {
    if (activeTab === 'INSURANCE') return item.issueType === 'Insurance' || item.issueType === 'PUC';
    if (activeTab === 'INSPECTION') return item.issueType === 'Fitness Certificate' || item.issueType === 'PUC';
    if (activeTab === 'SERVICE') return item.issueType === 'Service';
    return true;
  });

  const totalExpiredDocs = complianceDocs.filter(d => new Date(d.expiry_date) < now).length;
  const totalExpiringSoon = complianceDocs.filter(d => {
    const exp = new Date(d.expiry_date);
    return exp >= now && exp <= next30Days;
  }).length;
  const vehiclesInMaintenanceCount = vehicles.filter(v => v.status === 'Maintenance').length;
  const totalMaintenanceCost = historicalServices.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">
        
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Fleet Control Center</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Fleet Manager Dashboard
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              At-a-glance monitoring of vehicle compliance, insurance, inspection, and driver assignments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link href="/assignments/create">
              <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all border-0 cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Assign Vehicle
              </button>
            </Link>
            <Link href="/vehicles/create">
              <button className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Register Vehicle
              </button>
            </Link>
            <Link href="/service-queue">
              <button className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">build</span>
                Log Service
              </button>
            </Link>
            <Link href="/predictive-risk">
              <button className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">analytics</span>
                Predictive Risk
              </button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Core KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fleet</p>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600 text-[18px]">directions_car</span>
              </div>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-slate-900">{totalVehicles}</span>
              <span className="text-xs font-medium text-slate-500 ml-2">vehicles</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-2">{assignedVehicles} active assignments ({unassignedVehicles} unassigned)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-between hover:border-red-300 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Expired Documents</p>
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-[18px]">warning</span>
              </div>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-slate-900">{totalExpiredDocs}</span>
              <span className="text-xs font-medium text-slate-500 ml-2">overdue</span>
            </div>
            <p className="text-[11px] font-semibold text-red-600 mt-2">Hard-blocks assignment of affected vehicles</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Expiring in 30 Days</p>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 text-[18px]">schedule</span>
              </div>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-slate-900">{totalExpiringSoon}</span>
              <span className="text-xs font-medium text-slate-500 ml-2">documents</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-700 mt-2">Proactive renewal recommended</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Under Maintenance</p>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">build</span>
              </div>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-slate-900">{vehiclesInMaintenanceCount}</span>
              <span className="text-xs font-medium text-slate-500 ml-2">in shop</span>
            </div>
            <p className="text-[11px] font-semibold text-blue-600 mt-2">Historical maintenance spend: ${totalMaintenanceCost.toLocaleString()}</p>
          </div>
        </div>

        {/* AT-A-GLANCE ACTION FEED WIDGET */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Feed Header */}
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[22px]">notification_important</span>
                <h3 className="text-lg font-extrabold text-slate-900">Vehicles Requiring Immediate Attention</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time compliance feed for inspection, insurance, PUC, and service status without searching spreadsheets.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border-0 cursor-pointer ${activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All Urgent ({attentionItems.length})
              </button>
              <button
                onClick={() => setActiveTab('INSURANCE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border-0 cursor-pointer ${activeTab === 'INSURANCE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Insurance & PUC
              </button>
              <button
                onClick={() => setActiveTab('INSPECTION')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border-0 cursor-pointer ${activeTab === 'INSPECTION' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Inspection
              </button>
              <button
                onClick={() => setActiveTab('SERVICE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border-0 cursor-pointer ${activeTab === 'SERVICE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Service
              </button>
            </div>
          </div>

          {/* Feed Content Table */}
          {filteredAttentionItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-50">
              <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2 block">verified</span>
              <p className="font-bold text-slate-800">All Systems Clear</p>
              <p className="text-xs text-slate-500 mt-0.5">No vehicles match the selected compliance filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Vehicle</th>
                    <th className="px-6 py-3.5">Issue Detected</th>
                    <th className="px-6 py-3.5">Timeline / Expiry</th>
                    <th className="px-6 py-3.5">Assignment Protection</th>
                    <th className="px-6 py-3.5">Current Driver</th>
                    <th className="px-6 py-3.5 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredAttentionItems.map((item) => {
                    const isHardBlocked = item.isExpired || item.status === 'Maintenance';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/vehicles`} className="font-extrabold text-slate-900 hover:text-blue-600 transition-colors">
                            {item.vehicleNumber}
                          </Link>
                          <p className="text-xs text-slate-500">{item.manufacturer} {item.model}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${item.isExpired ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {item.issueType === 'Service' ? 'build' : item.isExpired ? 'error' : 'schedule'}
                            </span>
                            {item.issueTitle}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {item.daysDiff < 0 ? (
                            <span className="text-xs font-extrabold text-red-600">
                              Overdue by {Math.abs(item.daysDiff)} day{Math.abs(item.daysDiff) !== 1 ? 's' : ''}
                            </span>
                          ) : item.daysDiff === 0 ? (
                            <span className="text-xs font-extrabold text-amber-600">
                              Expires TODAY
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-700">
                              Due in {item.daysDiff} day{item.daysDiff !== 1 ? 's' : ''}
                            </span>
                          )}
                          {item.expiryDate && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {isHardBlocked ? (
                            <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-red-600">block</span>
                              Hard-Blocked
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-amber-500">warning</span>
                              Warning Active
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {item.assignedDriverName ? (
                            <span className="text-xs font-bold text-slate-800">{item.assignedDriverName}</span>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right space-x-2">
                          <Link href="/vehicles">
                            <button className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer">
                              Renew Doc
                            </button>
                          </Link>

                          <Link href="/assignments/create">
                            <button className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer">
                              Assign
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </LayoutWrapper>
  );
}