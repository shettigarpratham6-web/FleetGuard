'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { User, Vehicle, ServiceRecord, MaintenanceRisk } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [risks, setRisks] = useState<MaintenanceRisk[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State for sending notifications
  const [targetUserId, setTargetUserId] = useState('');
  const [targetVehicleId, setTargetVehicleId] = useState('');
  const [alertType, setAlertType] = useState('Compliance Alert');
  const [expiryDays, setExpiryDays] = useState('10');
  const [customMsg, setCustomMsg] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [sendError, setSendError] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    // Check authentication and authorize Admin/Managers
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = api.auth.getLocalUser();

if (!currentUser) {
  router.push('/login');
  return;
}

   const role = currentUser.role?.trim().toLowerCase();
    if (
     currentUser &&
     !['Admin', 'Fleet Manager', 'Manager'].includes(currentUser.role)
      ) {
    router.push('/dashboard');   // or '/dashboard' or '/home'
    return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehiclesData, serviceRecordsData, risksData, usersData] = await Promise.all([
          api.vehicles.getAll(),
          api.services.getAll(),
          api.risks.getAll(),
          api.auth.getUsers(),
        ]);
        setVehicles(vehiclesData || []);
        setServiceRecords(serviceRecordsData || []);
        setRisks(risksData || []);
        setUsers(usersData || []);
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to retrieve real-time data from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Calculate dynamic monthly costs from service records
  const getMonthlyCosts = () => {
    const monthlyData = [
      { name: 'Jan', cost: 0 },
      { name: 'Feb', cost: 0 },
      { name: 'Mar', cost: 0 },
      { name: 'Apr', cost: 0 },
      { name: 'May', cost: 0 },
      { name: 'Jun', cost: 0 },
      { name: 'Jul', cost: 0 },
      { name: 'Aug', cost: 0 },
      { name: 'Sep', cost: 0 },
      { name: 'Oct', cost: 0 },
      { name: 'Nov', cost: 0 },
      { name: 'Dec', cost: 0 }
    ];

    serviceRecords.forEach((record) => {
      const date = new Date(record.service_date);
      const month = date.getMonth();
      if (!isNaN(month)) {
        monthlyData[month].cost += Number(record.total_cost) || 0;
      }
    });

    const currentMonth = new Date().getMonth();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      let idx = currentMonth - i;
      if (idx < 0) idx += 12;
      result.push(monthlyData[idx]);
    }
    return result;
  };

  const monthlyCosts = getMonthlyCosts();
  const maxCost = Math.max(...monthlyCosts.map(m => m.cost), 100);

  // Filter recent service records based on search query
  const filteredRecords = serviceRecords.filter(
    (record) =>
      record.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles
        .find((v) => v.id === record.vehicle_id)
        ?.vehicle_number.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Filter upcoming services (scheduled in the future)
  const upcomingServices = serviceRecords
    .filter((sr) => sr.next_service_date && new Date(sr.next_service_date) >= new Date())
    .sort((a, b) => new Date(a.next_service_date!).getTime() - new Date(b.next_service_date!).getTime())
    .slice(0, 3);

  // Compute Risk Distribution
  const totalRisks = risks.length || 1;
  const highRiskCount = risks.filter((r) => r.risk_level === 'High').length;
  const mediumRiskCount = risks.filter((r) => r.risk_level === 'Medium').length;
  const lowRiskCount = risks.filter((r) => r.risk_level === 'Low').length;

  const lowPct = Math.round((lowRiskCount / totalRisks) * 100);
  const medPct = Math.round((mediumRiskCount / totalRisks) * 100);
  const highPct = 100 - lowPct - medPct;

  // Handle Send Expiry Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendSuccess('');
    setSendError('');

    if (!targetUserId) {
      setSendError('Please select a target user.');
      return;
    }

    const selectedUser = users.find(u => u.id === targetUserId);
    const selectedVehicle = vehicles.find(v => v.id === targetVehicleId);

    if (!selectedUser) {
      setSendError('Invalid user selected.');
      return;
    }

    setSendingAlert(true);

    try {
      const vNum = selectedVehicle ? selectedVehicle.vehicle_number : 'All Fleet';
      const daysStr = `${expiryDays} Days`;
      
      let title = '';
      let message = '';

      if (alertType === 'Compliance Alert') {
        title = `Compliance Expiry Alert in ${daysStr}`;
        message = customMsg || `Dear ${selectedUser.full_name}, your vehicle (${vNum}) compliance documents are set to expire in exactly ${expiryDays} days. Please upload updated fitness certificates or PUC details.`;
      } else {
        title = `Scheduled Maintenance in ${daysStr}`;
        message = customMsg || `Dear ${selectedUser.full_name}, your vehicle (${vNum}) is scheduled for routine maintenance checkup in ${expiryDays} days. Please drop it off at the nearest service center.`;
      }

      await api.notifications.create({
        user_id: targetUserId,
        vehicle_id: targetVehicleId || undefined,
        title,
        message,
        notification_type: alertType
      });

      setSendSuccess(`Alert sent successfully to ${selectedUser.full_name}!`);
      setCustomMsg('');
      setTargetVehicleId('');
      setTargetUserId('');
    } catch (err: any) {
      setSendError(err.message || 'Failed to dispatch alert.');
    } finally {
      setSendingAlert(false);
    }
  };

 if (loading) {
  return (
    <LayoutWrapper>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="material-symbols-outlined text-primary text-[20px] absolute">database</span>
        </div>
        <p className="font-medium text-sm text-on-surface-variant tracking-wide">
          Connecting to live PostgreSQL database...
        </p>
      </div>
    </LayoutWrapper>
  );
}

return (
  <LayoutWrapper
    searchPlaceholder="Search vehicles, VINs, or records..."
    searchValue={searchQuery}
    onSearchChange={setSearchQuery}
  >
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2 border-b border-outline-variant/40">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary/80 mb-1 block">
            Fleet Intelligence
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time status synced from PostgreSQL backend
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2.5 rounded-xl text-xs font-semibold border border-outline-variant/60 flex items-center gap-2 shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.98]">
            <span className="material-symbols-outlined text-[18px]">directions_car</span>
            New Vehicle
          </button>
          <button className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2.5 rounded-xl text-xs font-semibold border border-outline-variant/60 flex items-center gap-2 shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.98]">
            <span className="material-symbols-outlined text-[18px]">summarize</span>
            Generate Report
          </button>
          <Link href="/service-records/create">
            <button className="bg-primary hover:bg-primary/90 text-on-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]">
              <span className="material-symbols-outlined text-[18px]">add_notes</span>
              Create Service Record
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-error text-sm flex items-center gap-3 shadow-sm animate-fade-in">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Vehicles */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
          <div className="absolute -top-2 -right-2 p-3 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
            <span className="material-symbols-outlined text-[72px] text-primary">local_shipping</span>
          </div>
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Fleet Assets</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">{vehicles.length}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">arrow_upward</span> Live
            </span>
          </div>
        </div>

        {/* Due for Service */}
        <Link href="/maintenance-queue" className="block group">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Due for Service</p>
                <span className="material-symbols-outlined text-primary group-hover:rotate-12 transition-transform">build</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                  {mediumRiskCount + highRiskCount}
                </span>
                <span className="text-xs text-on-surface-variant">vehicles</span>
              </div>
            </div>
            <div className="mt-3 w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.round(((mediumRiskCount + highRiskCount) / (totalRisks || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </Link>

        {/* Overdue */}
        <Link href="/maintenance-queue" className="block group">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Overdue Tasks</p>
              <span className="material-symbols-outlined text-amber-500 group-hover:scale-110 transition-transform">warning</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                {highRiskCount}
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Requires attention</span>
            </div>
          </div>
        </Link>

        {/* High Risk */}
        <Link href="/predictive-risk" className="block group">
          <div className="bg-error-container/20 p-5 rounded-2xl border border-error/30 border-l-4 border-l-error shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-error uppercase tracking-wider">High Risk Alert</p>
              <span className="material-symbols-outlined text-error animate-bounce">report</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-extrabold text-error tracking-tight">
                {highRiskCount}
              </span>
              <span className="text-xs font-semibold text-error bg-error/10 px-2 py-0.5 rounded-full">
                Immediate Action
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts & Tables */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Cost Chart */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-6 flex flex-col h-[420px]">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-outline-variant/40">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Maintenance Expenditures</h3>
                <p className="text-xs text-on-surface-variant">Monthly breakdown dynamically aggregated from database records</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                USD ($)
              </span>
            </div>
            
            <div className="flex-1 relative flex items-end justify-between pt-6 px-2 gap-2">
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 px-2 pt-6">
                <div className="w-full border-t border-outline-variant/30 border-dashed"></div>
                <div className="w-full border-t border-outline-variant/30 border-dashed"></div>
                <div className="w-full border-t border-outline-variant/30 border-dashed"></div>
                <div className="w-full border-t border-outline-variant/30 border-dashed"></div>
                <div className="w-full border-t border-outline-variant/50 border-solid"></div>
              </div>
              
              {/* Dynamic Bars */}
              <div className="relative w-full h-full flex items-end justify-between px-4 z-10 pb-8">
                {monthlyCosts.map((m, index) => {
                  const heightPct = Math.round((m.cost / (maxCost || 1)) * 80) + 8;
                  const isLast = index === monthlyCosts.length - 1;
                  return (
                    <div key={m.name} className="flex flex-col items-center w-10 md:w-12 group relative">
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 relative ${
                          isLast 
                            ? 'bg-primary shadow-md shadow-primary/20' 
                            : 'bg-primary/20 group-hover:bg-primary/50'
                        }`}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[11px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-md whitespace-nowrap z-20 pointer-events-none">
                          ${m.cost.toFixed(0)}
                        </div>
                      </div>
                      <span className={`absolute bottom-0 text-xs mt-2 pt-1 font-medium ${isLast ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                        {m.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Service Records Table */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/40 bg-surface-container-low/30">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Recent Service Records</h3>
                <p className="text-xs text-on-surface-variant">Live maintenance records and log history</p>
              </div>
              <Link href="/service-records" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/60 border-b border-outline-variant/40 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="p-4 pl-6">Vehicle ID</th>
                    <th className="p-4">Service Type</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 pr-6">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-sm">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.slice(0, 6).map((record) => {
                      const vehicle = vehicles.find((v) => v.id === record.vehicle_id);
                      return (
                        <tr key={record.id} className="hover:bg-surface-container-low/40 transition-colors group">
                          <td className="p-4 pl-6">
                            <Link href={`/vehicles/${vehicle?.id}`} className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-all">
                                <span className="material-symbols-outlined text-[18px]">directions_car</span>
                              </div>
                              <span className="font-mono text-xs font-semibold text-on-surface hover:text-primary transition-colors">
                                {vehicle?.vehicle_number || 'Unknown'}
                              </span>
                            </Link>
                          </td>
                          <td className="p-4 font-semibold text-on-surface">
                            {record.service_type}
                          </td>
                          <td className="p-4 text-xs text-on-surface-variant font-medium">
                            {new Date(record.service_date).toLocaleDateString()}
                          </td>
                          <td className="p-4 pr-6 font-mono text-xs font-bold text-on-surface">
                            ${Number(record.total_cost).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-xs text-on-surface-variant">
                        No service records found in backend database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Registered User Directory */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-outline-variant/40 bg-surface-container-low/30">
              <h3 className="text-lg font-bold text-on-surface">Registered User Directory</h3>
              <p className="text-xs text-on-surface-variant">Active personnel and system organization profiles</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/60 border-b border-outline-variant/40 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="p-4 pl-6">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 pr-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-sm">
                  {users.length > 0 ? (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full ring-2 ring-outline-variant/40 overflow-hidden bg-surface-container">
                            <img 
                              src={u.profile_picture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyNWRLx_E1OWgPi7aT-s7keymJamS_sAULSOKC77sBamBVVEH8asmCa3f4NYOaE3mG3geTNRGrCEk9EHHGtRbopLaZ52J0biD4pjdRExkF4tELoYtoq-zasE6so0CeaGSIAvvheeL2qrq5EGlYXYnXy2LFAAHWpIX7MRS7rUU0FgN3ulrekGF7ncrztv17tLcE_3HUrNuSMCnC1wGiBZ6Az6Q7ajamDg6nZkmfN3G0rW9Vloo_heFU'} 
                              alt={u.full_name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <span className="font-semibold text-on-surface">{u.full_name}</span>
                        </td>
                        <td className="p-4 text-xs text-on-surface-variant font-mono">{u.email}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-variant text-on-surface-variant border border-outline-variant/40">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 pr-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            u.status === 'Active' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-xs text-on-surface-variant">
                        No registered users found in directory.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Risk & Expiry Alert Dispatcher */}
        <div className="space-y-8">
          
          {/* Risk Distribution Chart */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-6">
            <h3 className="text-lg font-bold text-on-surface mb-6">Risk Distribution</h3>
            <div className="flex flex-col items-center">
              <div 
                className="w-48 h-48 relative mb-6 rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: `conic-gradient(var(--color-error) 0% ${highPct}%, var(--color-surface-tint) ${highPct}% ${highPct + medPct}%, var(--color-secondary-container) ${highPct + medPct}% 100%)`
                }}
              >
                <div className="absolute inset-5 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-3xl font-extrabold text-on-surface tracking-tight">
                    {vehicles.length}
                  </span>
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Assets</span>
                </div>
              </div>

              <div className="w-full space-y-2">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-surface-container-low/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
                    <span className="text-xs font-semibold text-on-surface">Low Risk (Healthy)</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-on-surface">{lowPct}%</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-surface-container-low/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-surface-tint"></div>
                    <span className="text-xs font-semibold text-on-surface">Moderate Risk</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-on-surface">{medPct}%</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-surface-container-low/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <span className="text-xs font-semibold text-on-surface">High Risk</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-error">{highPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expiry Alerts Form */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-6">
            <div className="pb-3 border-b border-outline-variant/40 mb-4">
              <h3 className="text-lg font-bold text-on-surface">Dispatch Expiry Alerts</h3>
              <p className="text-xs text-on-surface-variant">Send direct 10/7/5 days expiry notices to driver in-app bar</p>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              {sendSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {sendSuccess}
                </div>
              )}
              {sendError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {sendError}
                </div>
              )}

              {/* Target User */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider">Select Recipient User *</label>
                <select 
                  value={targetUserId} 
                  onChange={e => setTargetUserId(e.target.value)}
                  required
                  className="w-full bg-surface-container-low rounded-xl border border-outline-variant/60 px-3 py-2 text-xs font-medium text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">-- Choose User --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {/* Target Vehicle */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider">Select Vehicle (Optional)</label>
                <select 
                  value={targetVehicleId} 
                  onChange={e => setTargetVehicleId(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl border border-outline-variant/60 px-3 py-2 text-xs font-medium text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicle_number} - {v.model}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Alert Type */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1.5 uppercase tracking-wider">Alert Type</label>
                  <select 
                    value={alertType} 
                    onChange={e => setAlertType(e.target.value)}
                    className="w-full bg-surface-container-low rounded-xl border border-outline-variant/60 px-2.5 py-2 text-xs font-medium text-on-surface outline-none focus:border-primary transition-all"
                  >
                    <option value="Compliance Alert">Compliance Alert</option>
                    <option value="Maintenance Alert">Maintenance Alert</option>
                  </select>
                </div>

                {/* Expiry Days */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1.5 uppercase tracking-wider">Expiry Due</label>
                  <select 
                    value={expiryDays} 
                    onChange={e => setExpiryDays(e.target.value)}
                    className="w-full bg-surface-container-low rounded-xl border border-outline-variant/60 px-2.5 py-2 text-xs font-medium text-on-surface outline-none focus:border-primary transition-all"
                  >
                    <option value="10">10 Days Due</option>
                    <option value="7">7 Days Due</option>
                    <option value="5">5 Days Due</option>
                  </select>
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1.5 uppercase tracking-wider">Custom Message (Optional)</label>
                <textarea 
                  placeholder="Leave empty for auto-generated template..."
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container-low rounded-xl border border-outline-variant/60 px-3 py-2 text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={sendingAlert}
                className="w-full bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {sendingAlert ? (
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Dispatch In-App Alert</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Upcoming Services List */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-6 flex flex-col h-[320px]">
            <div className="pb-3 border-b border-outline-variant/40 mb-4">
              <h3 className="text-lg font-bold text-on-surface">Upcoming Scheduled Services</h3>
              <p className="text-xs text-on-surface-variant">Active scheduled dates in maintenance queue</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {upcomingServices.length > 0 ? (
                upcomingServices.map((record) => {
                  const vehicle = vehicles.find((v) => v.id === record.vehicle_id);
                  const nextDate = record.next_service_date ? new Date(record.next_service_date) : null;
                  return (
                    <div key={record.id} className="flex gap-3 group">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold group-hover:bg-primary group-hover:text-on-primary transition-all">
                          {nextDate ? nextDate.getDate() : '??'}
                        </div>
                        <div className="w-px h-full bg-outline-variant/40 mt-2"></div>
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="bg-surface-container-low/50 p-3 rounded-xl border border-transparent group-hover:border-outline-variant/60 transition-all">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-xs font-bold text-on-surface">{record.service_type}</h4>
                            <span className="font-mono text-[11px] font-semibold text-on-surface-variant">
                              {vehicle?.vehicle_number || 'N/A'}
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span> 
                            {nextDate ? nextDate.toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-on-surface-variant py-8">
                  No upcoming service schedules found.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  </LayoutWrapper>
);
}