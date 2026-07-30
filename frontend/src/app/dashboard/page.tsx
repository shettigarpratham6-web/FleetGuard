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
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body-md text-on-surface-variant">Connecting to live PostgreSQL database...</p>
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
      <div className="p-lg md:p-margin-desktop space-y-lg max-w-7xl mx-auto">
        
        {/* Header & Quick Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
          <div>
            <h2 className="font-display-lg text-display-lg text-primary">Overview</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
              Live status from PostgreSQL backend.
            </p>
          </div>
          <div className="flex flex-wrap gap-sm">
            <button className="bg-surface-container-high text-on-surface px-md py-sm rounded-lg font-label-md text-label-md hover:bg-surface-container-highest transition-colors border border-outline-variant flex items-center gap-xs cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined text-[18px]">directions_car</span>
              New Vehicle
            </button>
            <button className="bg-surface-container-high text-on-surface px-md py-sm rounded-lg font-label-md text-label-md hover:bg-surface-container-highest transition-colors border border-outline-variant flex items-center gap-xs cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined text-[18px]">summarize</span>
              Generate Report
            </button>
            <Link href="/service-records/create">
              <button className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-xs shadow-sm cursor-pointer active:opacity-80">
                <span className="material-symbols-outlined text-[18px]">add_notes</span>
                Create Service Record
              </button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-md rounded-xl bg-error-container/10 border border-error-container/30 text-error text-body-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {/* KPI Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {/* Total Vehicles */}
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-sm opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[64px] text-primary">local_shipping</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase">Total Vehicles</p>
            <div className="mt-sm flex items-baseline gap-sm">
              <span className="font-display-lg text-display-lg text-primary">{vehicles.length}</span>
              <span className="font-body-sm text-body-sm text-[#16a34a] flex items-center">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> Live
              </span>
            </div>
          </div>

          {/* Due for Service */}
          <Link href="/maintenance-queue" className="block">
            <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow h-full">
              <div className="flex justify-between items-start">
                <p className="font-label-md text-label-md text-on-surface-variant uppercase">Due for Service</p>
                <span className="material-symbols-outlined text-surface-tint">build</span>
              </div>
              <div className="mt-sm flex items-baseline gap-sm">
                <span className="font-display-lg text-display-lg text-surface-tint">
                  {mediumRiskCount + highRiskCount}
                </span>
              </div>
              <div className="mt-md w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-surface-tint h-full" style={{ width: `${Math.round(((mediumRiskCount + highRiskCount) / totalRisks) * 100)}%` }}></div>
              </div>
            </div>
          </Link>

          {/* Overdue */}
          <Link href="/maintenance-queue" className="block">
            <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow border-l-4 border-l-[#d97706] h-full">
              <div className="flex justify-between items-start">
                <p className="font-label-md text-label-md text-on-surface-variant uppercase">Overdue</p>
                <span className="material-symbols-outlined text-[#d97706]">warning</span>
              </div>
              <div className="mt-sm flex items-baseline gap-sm">
                <span className="font-display-lg text-display-lg text-on-surface">
                  {highRiskCount}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">vehicles</span>
              </div>
            </div>
          </Link>

          {/* High Risk */}
          <Link href="/predictive-risk" className="block">
            <div className="bg-error-container p-lg rounded-xl border border-[#ffb4ab] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow border-l-4 border-l-error h-full">
              <div className="flex justify-between items-start">
                <p className="font-label-md text-label-md text-on-error-container uppercase">High Risk</p>
                <span className="material-symbols-outlined text-error">report</span>
              </div>
              <div className="mt-sm flex items-baseline gap-sm">
                <span className="font-display-lg text-display-lg text-on-error-container">
                  {highRiskCount}
                </span>
                <span className="font-body-sm text-body-sm text-error ml-xs">immediate action</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Charts & Lists Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Left Column: Charts & Table */}
          <div className="lg:col-span-2 space-y-lg">
            
            {/* Cost Chart */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-lg flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-md pb-sm border-b border-outline-variant">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Maintenance Expenditures</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Monthly spending dynamically calculated from backend records</p>
                </div>
              </div>
              <div className="flex-1 relative flex items-end justify-between pt-lg px-md gap-sm">
                {/* Chart Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 px-md pt-lg">
                  <div className="w-full border-t border-outline-variant border-dashed"></div>
                  <div className="w-full border-t border-outline-variant border-dashed"></div>
                  <div className="w-full border-t border-outline-variant border-dashed"></div>
                  <div className="w-full border-t border-outline-variant border-dashed"></div>
                  <div className="w-full border-t border-outline-variant border-solid"></div>
                </div>
                
                {/* Dynamic Bars */}
                <div className="relative w-full h-full flex items-end justify-between px-lg z-10 pb-8">
                  {monthlyCosts.map((m, index) => {
                    const heightPct = Math.round((m.cost / maxCost) * 80) + 5; // offset for visible bar
                    const isLast = index === monthlyCosts.length - 1;
                    return (
                      <div key={m.name} className="flex flex-col items-center w-12 group">
                        <div 
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 relative ${isLast ? 'bg-primary shadow-md' : 'bg-primary-fixed-dim group-hover:bg-primary-fixed'}`}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                            ${m.cost.toFixed(0)}
                          </div>
                        </div>
                        <span className={`absolute bottom-0 font-body-sm text-body-sm mt-sm pt-xs ${isLast ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                          {m.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Service Records Table */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="flex justify-between items-center p-lg border-b border-outline-variant bg-surface-bright">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Service Records</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Live maintenance records history</p>
                </div>
                <Link href="/service-records" className="text-primary font-label-md text-label-md hover:underline">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-on-surface-variant">
                      <th className="p-sm pl-lg font-medium">Vehicle ID</th>
                      <th className="p-sm font-medium">Service Type</th>
                      <th className="p-sm font-medium">Date</th>
                      <th className="p-sm font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.slice(0, 6).map((record) => {
                        const vehicle = vehicles.find((v) => v.id === record.vehicle_id);
                        return (
                          <tr
                            key={record.id}
                            className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group cursor-pointer"
                          >
                            <td className="p-sm pl-lg">
                              <Link href={`/vehicles/${vehicle?.id}`} className="flex items-center gap-sm">
                                <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary-fixed transition-colors">
                                  <span className="material-symbols-outlined text-[16px]">
                                    local_shipping
                                  </span>
                                </div>
                                <span className="font-data-mono text-data-mono hover:underline">{vehicle?.vehicle_number || 'Unknown'}</span>
                              </Link>
                            </td>
                            <td className="p-sm text-on-surface font-semibold">
                              {record.service_type}
                            </td>
                            <td className="p-sm text-on-surface-variant text-sm">
                              {new Date(record.service_date).toLocaleDateString()}
                            </td>
                            <td className="p-sm font-data-mono text-data-mono text-on-surface">
                              ${Number(record.total_cost).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-lg text-center text-on-surface-variant">
                          No service records found in backend.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Users Directory Table */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-lg border-b border-outline-variant bg-surface-bright">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Registered User Directory</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Active personnel and organization profiles</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-on-surface-variant">
                      <th className="p-sm pl-lg font-medium">Name</th>
                      <th className="p-sm font-medium">Email</th>
                      <th className="p-sm font-medium">Role</th>
                      <th className="p-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md">
                    {users.length > 0 ? (
                      users.map((u) => (
                        <tr key={u.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                          <td className="p-sm pl-lg flex items-center gap-sm">
                            <div className="w-7 h-7 rounded-full bg-secondary-container overflow-hidden border border-outline-variant">
                              <img 
                                src={u.profile_picture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyNWRLx_E1OWgPi7aT-s7keymJamS_sAULSOKC77sBamBVVEH8asmCa3f4NYOaE3mG3geTNRGrCEk9EHHGtRbopLaZ52J0biD4pjdRExkF4tELoYtoq-zasE6so0CeaGSIAvvheeL2qrq5EGlYXYnXy2LFAAHWpIX7MRS7rUU0FgN3ulrekGF7ncrztv17tLcE_3HUrNuSMCnC1wGiBZ6Az6Q7ajamDg6nZkmfN3G0rW9Vloo_heFU'} 
                                alt={u.full_name} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <span className="font-semibold text-on-surface">{u.full_name}</span>
                          </td>
                          <td className="p-sm text-on-surface-variant text-sm">{u.email}</td>
                          <td className="p-sm">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-surface-variant text-on-surface-variant">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${u.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-lg text-center text-on-surface-variant">
                          No users registered in directory.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Risk & Expiry alert dispatch */}
          <div className="space-y-lg">
            
            {/* Risk Distribution Pie Chart */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-lg">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Risk Distribution</h3>
              <div className="flex flex-col items-center">
                <div 
                  className="w-48 h-48 relative mb-lg shadow-inner rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(var(--color-error) 0% ${highPct}%, var(--color-surface-tint) ${highPct}% ${highPct + medPct}%, var(--color-secondary-container) ${highPct + medPct}% 100%)`
                  }}
                >
                  <div className="absolute inset-4 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center">
                    <span className="font-display-lg text-display-lg text-on-surface font-bold">
                      {vehicles.length}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Total Assets</span>
                  </div>
                </div>
                <div className="w-full space-y-xs">
                  <div className="flex justify-between items-center p-sm rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-sm">
                      <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
                      <span className="font-body-sm text-body-sm text-on-surface">Low Risk (Healthy)</span>
                    </div>
                    <span className="font-data-mono text-data-mono font-bold">{lowPct}%</span>
                  </div>
                  <div className="flex justify-between items-center p-sm rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-sm">
                      <div className="w-3 h-3 rounded-full bg-surface-tint"></div>
                      <span className="font-body-sm text-body-sm text-on-surface">Moderate Risk</span>
                    </div>
                    <span className="font-data-mono text-data-mono font-bold">{medPct}%</span>
                  </div>
                  <div className="flex justify-between items-center p-sm rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-sm">
                      <div className="w-3 h-3 rounded-full bg-error"></div>
                      <span className="font-body-sm text-body-sm text-on-surface">High Risk</span>
                    </div>
                    <span className="font-data-mono text-data-mono font-bold text-error">{highPct}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* In-app Expiry Dispatcher Form (Admin sends 10/7/5 alerts) */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-lg flex flex-col">
              <div className="pb-sm border-b border-outline-variant mb-md">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Dispatch Expiry Alerts</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Send a manual 10/7/5 days expiry notice to driver in-app bar</p>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-md">
                {sendSuccess && (
                  <div className="p-sm rounded-lg bg-[#dcfce7] border border-[#bbf7d0] text-[#166534] text-xs flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    {sendSuccess}
                  </div>
                )}
                {sendError && (
                  <div className="p-sm rounded-lg bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-xs flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {sendError}
                  </div>
                )}

                {/* Target User */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-xs">Select Recipient User *</label>
                  <select 
                    value={targetUserId} 
                    onChange={e => setTargetUserId(e.target.value)}
                    required
                    className="w-full bg-surface-container rounded-lg border border-outline-variant px-sm py-xs text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Choose User --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                {/* Target Vehicle */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-xs">Select Vehicle (Optional)</label>
                  <select 
                    value={targetVehicleId} 
                    onChange={e => setTargetVehicleId(e.target.value)}
                    className="w-full bg-surface-container rounded-lg border border-outline-variant px-sm py-xs text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.vehicle_number} - {v.model}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-sm">
                  {/* Alert Type */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-xs">Notification Type</label>
                    <select 
                      value={alertType} 
                      onChange={e => setAlertType(e.target.value)}
                      className="w-full bg-surface-container rounded-lg border border-outline-variant px-sm py-xs text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="Compliance Alert">Compliance Alert</option>
                      <option value="Maintenance Alert">Maintenance Alert</option>
                    </select>
                  </div>

                  {/* Expiry Days */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-xs">Expiry Days</label>
                    <select 
                      value={expiryDays} 
                      onChange={e => setExpiryDays(e.target.value)}
                      className="w-full bg-surface-container rounded-lg border border-outline-variant px-sm py-xs text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="10">10 Days Due</option>
                      <option value="7">7 Days Due</option>
                      <option value="5">5 Days Due</option>
                    </select>
                  </div>
                </div>

                {/* Custom message content */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-xs">Custom Message (Optional)</label>
                  <textarea 
                    placeholder="Leave empty to send default auto-generated message templates..."
                    value={customMsg}
                    onChange={e => setCustomMsg(e.target.value)}
                    rows={3}
                    className="w-full bg-surface-container rounded-lg border border-outline-variant px-sm py-xs text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={sendingAlert}
                  className="w-full bg-primary hover:opacity-90 active:opacity-85 text-on-primary text-xs font-semibold py-xs rounded-lg flex items-center justify-center gap-xs shadow-sm cursor-pointer disabled:opacity-50"
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
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-lg flex flex-col h-[300px]">
              <div className="flex justify-between items-center mb-md pb-sm border-b border-outline-variant">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Upcoming Scheduled Services</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Active scheduled dates</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-xs space-y-md">
                {upcomingServices.length > 0 ? (
                  upcomingServices.map((record) => {
                    const vehicle = vehicles.find((v) => v.id === record.vehicle_id);
                    const nextDate = record.next_service_date ? new Date(record.next_service_date) : null;
                    return (
                      <div key={record.id} className="flex gap-md group">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-md text-label-md group-hover:bg-primary group-hover:text-on-primary transition-colors">
                            {nextDate ? nextDate.getDate() : '??'}
                          </div>
                          <div className="w-px h-full bg-outline-variant mt-sm"></div>
                        </div>
                        <div className="flex-1 pb-md">
                          <div className="bg-surface-container-low p-sm rounded-lg border border-transparent group-hover:border-outline-variant transition-colors">
                            <div className="flex justify-between items-start mb-xs">
                              <h4 className="font-label-md text-label-md text-on-surface font-semibold">{record.service_type}</h4>
                              <span className="font-data-mono text-data-mono text-xs text-on-surface-variant">{vehicle?.vehicle_number || 'N/A'}</span>
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                              <span className="material-symbols-outlined text-[14px]">calendar_today</span> 
                              {nextDate ? nextDate.toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-xs text-on-surface-variant mt-lg">No upcoming service schedules found.</p>
                )}
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </LayoutWrapper>
  );
}
