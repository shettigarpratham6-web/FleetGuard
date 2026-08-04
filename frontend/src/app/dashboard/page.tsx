'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { User, Vehicle, ServiceRecord, MaintenanceRisk } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [historicalServices, setHistoricalServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');

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
        const [vehiclesData, usersData, docsData, assignmentsData, historicalServicesData] = await Promise.all([
          api.vehicles.getAll(),
          api.auth.getUsers(),
          api.compliance.getAll().catch(() => []),
          api.assignments?.getAll?.() || Promise.resolve([]),
          api.historicalServices?.getAll?.().catch(() => []) || Promise.resolve([])
        ]);
        setVehicles(vehiclesData || []);
        setUsers(usersData || []);
        setComplianceDocs(docsData || []);
        setAssignments(assignmentsData || []);
        setHistoricalServices(Array.isArray(historicalServicesData) ? historicalServicesData : (historicalServicesData as any)?.services || []);
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
            Loading dashboard...
          </p>
        </div>
      </LayoutWrapper>
    );
  }

  const isAdmin = userRole === 'Admin';

  // KPI Calculations
  const totalVehicles = vehicles.length;
  const assignedVehicles = assignments.filter(a => a.status === 'Active').length;
  const unassignedVehicles = totalVehicles - assignedVehicles;

  const drivers = users.filter(u => u.role === 'Driver');
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(u => u.status === 'Active').length;
  const pendingDrivers = drivers.filter(u => u.status === 'Pending').length;

  const now = new Date();
  
  // Calculate expired documents and service overdue
  const expiredVehiclesSet = new Set<string>();
  const serviceOverdueVehiclesSet = new Set<string>();

  let expiringSoonDocs = 0;
  let overdueDocsCount = 0;
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  complianceDocs.forEach(doc => {
    const expDate = new Date(doc.expiry_date);
    if (expDate < now) {
      expiredVehiclesSet.add(doc.vehicle_id);
      overdueDocsCount++;
    } else if (expDate <= next30Days) {
      expiringSoonDocs++;
    }
  });

  const totalMaintenanceCost = historicalServices.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

  // Calculate problem issues based on service records (simulated based on logic)
  // For a complete implementation, this would join actual tables

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Overview of fleet status and compliance.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Vehicles KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Vehicles</p>
              <span className="material-symbols-outlined text-slate-400">directions_car</span>
            </div>
            <span className="text-3xl font-extrabold text-slate-900">{totalVehicles}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Vehicles</p>
              <span className="material-symbols-outlined text-slate-400">check_circle</span>
            </div>
            <span className="text-3xl font-extrabold text-slate-900">{assignedVehicles}</span>
          </div>
          {isAdmin && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unassigned Vehicles</p>
                <span className="material-symbols-outlined text-slate-400">cancel</span>
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{unassignedVehicles}</span>
            </div>
          )}
        </div>

        {/* Drivers KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Drivers</p>
              <span className="material-symbols-outlined text-slate-400">group</span>
            </div>
            <span className="text-3xl font-extrabold text-slate-900">{totalDrivers}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Drivers</p>
              <span className="material-symbols-outlined text-amber-500">pending_actions</span>
            </div>
            <span className="text-3xl font-extrabold text-slate-900">{pendingDrivers}</span>
          </div>
          {isAdmin && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Drivers</p>
                <span className="material-symbols-outlined text-emerald-500">verified_user</span>
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{activeDrivers}</span>
            </div>
          )}
        </div>

        {/* Fleet Manager Specific KPIs */}
        {!isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicles Requiring Service</p>
                <span className="material-symbols-outlined text-amber-500">build</span>
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{serviceOverdueVehiclesSet.size}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expired Documents</p>
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <span className="text-3xl font-extrabold text-slate-900">{expiredVehiclesSet.size}</span>
            </div>
          </div>
        )}

        {/* Admin Compliance Dashboard */}
        {isAdmin && (
          <div className="mt-8 mb-4">
            <h3 className="font-extrabold text-slate-900 text-xl mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">policy</span>
              Fleet Compliance & Risk Engine
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-between hover:border-red-300 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Already Overdue</p>
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 text-[18px]">warning</span>
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-slate-900">{overdueDocsCount}</span>
                  <span className="text-sm font-semibold text-slate-500 ml-2">documents</span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-3 border-t border-slate-100 pt-3">Vehicles with these docs are hard-blocked from assignment.</p>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Expiring Soon (30 Days)</p>
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">schedule</span>
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-slate-900">{expiringSoonDocs}</span>
                  <span className="text-sm font-semibold text-slate-500 ml-2">documents</span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-3 border-t border-slate-100 pt-3">Proactive renewals required to prevent operational blockages.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Maintenance Cost</p>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">payments</span>
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-slate-900">${totalMaintenanceCost.toLocaleString()}</span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-3 border-t border-slate-100 pt-3">Historical spend across all fleet service records.</p>
              </div>
            </div>
          </div>
        )}


      </div>
    </LayoutWrapper>
  );
}