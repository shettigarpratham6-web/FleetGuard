'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import HeroBackground from '@/components/HeroBackground';
import { api } from '@/services/api';
import { User, Vehicle, ServiceRecord, MaintenanceRisk } from '@/types';

// ─── Skeleton loader component ───────────────────────────────
function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/60 p-5 space-y-3 shadow-sm">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-8 w-16 rounded" />
      <div className="skeleton h-2 w-32 rounded" />
    </div>
  );
}

// ─── Bar chart bar ────────────────────────────────────────────
function ChartBar({ month, cost, maxCost, isLast, index }: { month: string; cost: number; maxCost: number; isLast: boolean; index: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const heightPct = Math.round((cost / maxCost) * 78) + 5;

  return (
    <div className="flex flex-col items-center flex-1 group">
      <div className="relative w-full flex items-end" style={{ height: '200px' }}>
        {/* Tooltip */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-md">
          ${cost.toFixed(0)}
        </div>
        {/* Bar */}
        <div
          ref={barRef}
          className={`w-full rounded-t-lg transition-all duration-700 cursor-pointer ${
            isLast
              ? 'shadow-lg'
              : 'group-hover:opacity-80'
          }`}
          style={{
            height: `${heightPct}%`,
            background: isLast
              ? 'linear-gradient(180deg, #1e3a5f 0%, #091426 100%)'
              : 'linear-gradient(180deg, #bcc7de 0%, #8590a6 100%)',
            transformOrigin: 'bottom',
            animation: `bar-grow 0.6s ease ${index * 80}ms both`,
          }}
          title={`${month}: $${cost.toFixed(0)}`}
        />
      </div>
      <span className={`text-[11px] mt-1 font-medium ${isLast ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
        {month}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [risks, setRisks] = useState<MaintenanceRisk[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Notification dispatcher form state
  const [targetUserId, setTargetUserId] = useState('');
  const [targetVehicleId, setTargetVehicleId] = useState('');
  const [alertType, setAlertType] = useState('Compliance Alert');
  const [expiryDays, setExpiryDays] = useState('10');
  const [customMsg, setCustomMsg] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [sendError, setSendError] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);

  // Report toast
  const [reportToast, setReportToast] = useState(false);

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
    if (!['Admin', 'Fleet Manager', 'Manager'].includes(currentUser.role)) {
      router.push('/dashboard');
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

  // Monthly cost aggregation
  const getMonthlyCosts = () => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      cost: 0,
    }));
    serviceRecords.forEach((record) => {
      const month = new Date(record.service_date).getMonth();
      if (!isNaN(month)) monthlyData[month].cost += Number(record.total_cost) || 0;
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

  const filteredRecords = serviceRecords.filter(
    (record) =>
      record.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles.find((v) => v.id === record.vehicle_id)
        ?.vehicle_number.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const upcomingServices = serviceRecords
    .filter((sr) => sr.next_service_date && new Date(sr.next_service_date) >= new Date())
    .sort((a, b) => new Date(a.next_service_date!).getTime() - new Date(b.next_service_date!).getTime())
    .slice(0, 3);

  const totalRisks = risks.length || 1;
  const highRiskCount = risks.filter((r) => r.risk_level === 'High').length;
  const mediumRiskCount = risks.filter((r) => r.risk_level === 'Medium').length;
  const lowRiskCount = risks.filter((r) => r.risk_level === 'Low').length;
  const lowPct = Math.round((lowRiskCount / totalRisks) * 100);
  const medPct = Math.round((mediumRiskCount / totalRisks) * 100);
  const highPct = 100 - lowPct - medPct;

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendSuccess('');
    setSendError('');
    if (!targetUserId) { setSendError('Please select a target user.'); return; }
    const selectedUser = users.find(u => u.id === targetUserId);
    const selectedVehicle = vehicles.find(v => v.id === targetVehicleId);
    if (!selectedUser) { setSendError('Invalid user selected.'); return; }
    setSendingAlert(true);
    try {
      const vNum = selectedVehicle ? selectedVehicle.vehicle_number : 'All Fleet';
      const daysStr = `${expiryDays} Days`;
      let title = '';
      let message = '';
      if (alertType === 'Compliance Alert') {
        title = `Compliance Expiry Alert in ${daysStr}`;
        message = customMsg || `Dear ${selectedUser.full_name}, your vehicle (${vNum}) compliance documents expire in ${expiryDays} days. Please upload updated documents.`;
      } else {
        title = `Scheduled Maintenance in ${daysStr}`;
        message = customMsg || `Dear ${selectedUser.full_name}, your vehicle (${vNum}) is due for routine maintenance in ${expiryDays} days.`;
      }
      await api.notifications.create({ user_id: targetUserId, vehicle_id: targetVehicleId || undefined, title, message, notification_type: alertType });
      setSendSuccess(`Alert sent successfully to ${selectedUser.full_name}!`);
      setCustomMsg(''); setTargetVehicleId(''); setTargetUserId('');
    } catch (err: any) {
      setSendError(err.message || 'Failed to dispatch alert.');
    } finally {
      setSendingAlert(false);
    }
  };

  const handleGenerateReport = () => {
    setReportToast(true);
    setTimeout(() => setReportToast(false), 3000);
    window.print();
  };

  // ── SKELETON LOADING STATE ─────────────────────────────────
  if (loading) {
    return (
      <LayoutWrapper>
        <div className="p-lg md:p-margin-desktop space-y-lg max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <div className="skeleton h-8 w-40 rounded-lg" />
              <div className="skeleton h-4 w-56 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-9 w-28 rounded-xl" />
              <div className="skeleton h-9 w-32 rounded-xl" />
              <div className="skeleton h-9 w-36 rounded-xl" />
            </div>
          </div>
          {/* KPI skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
            {[1, 2, 3, 4].map(i => <StatSkeleton key={i} />)}
          </div>
          {/* Chart skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            <div className="lg:col-span-2 space-y-lg">
              <div className="bg-white rounded-2xl border border-outline-variant/60 p-lg h-[400px] shadow-sm">
                <div className="skeleton h-4 w-48 rounded mb-2" />
                <div className="skeleton h-3 w-64 rounded mb-8" />
                <div className="flex items-end gap-3 h-48 px-4">
                  {[60, 40, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 skeleton rounded-t-lg" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-lg">
              <div className="bg-white rounded-2xl border border-outline-variant/60 p-lg h-64 shadow-sm">
                <div className="skeleton h-4 w-32 rounded mb-4" />
                <div className="w-40 h-40 skeleton rounded-full mx-auto" />
              </div>
            </div>
          </div>
          <p className="font-semibold text-sm text-slate-600 tracking-wide">
            Connecting to live PostgreSQL database...
          </p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Animated CSS Hero Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <HeroBackground />
      </div>

      {/* Dashboard content rendered above background */}
      <div className="relative z-10">
    <LayoutWrapper
      searchPlaceholder="Search vehicles, VINs, or records..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Report toast */}
      {reportToast && (
        <div className="fixed top-4 right-4 z-[100] bg-primary text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-slide-in-right">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Report sent to printer!
        </div>
      )}

      <div className="p-lg md:p-margin-desktop space-y-lg max-w-7xl mx-auto">

        {/* ── Header & Quick Actions ───────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md animate-fade-in-up">
          <div>
            <h2 className="font-black text-[28px] md:text-[32px] text-primary leading-tight">Overview</h2>
            <p className="text-[14px] text-on-surface-variant mt-1">
              Live status from PostgreSQL backend.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* ✅ New Vehicle — now linked */}
            <Link href="/vehicles/new">
              <button className="bg-surface-container-high text-on-surface px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-surface-container-highest transition-all border border-outline-variant/60 flex items-center gap-1.5 cursor-pointer btn-scale shadow-sm focus-ring">
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">directions_car</span>
                New Vehicle
              </button>
            </Link>

            {/* ✅ Generate Report — now functional */}
            <button
              onClick={handleGenerateReport}
              className="bg-surface-container-high text-on-surface px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-surface-container-highest transition-all border border-outline-variant/60 flex items-center gap-1.5 cursor-pointer btn-scale shadow-sm focus-ring"
            >
              <span className="material-symbols-outlined text-[17px]" aria-hidden="true">summarize</span>
              Generate Report
            </button>

            {/* ✅ Create Service Record */}
            <Link href="/service-records/create">
              <button className="text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md cursor-pointer btn-scale focus-ring border-0" style={{ background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}>
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">add_notes</span>
                Create Service Record
              </button>
            </Link>
          </div>
        </div>
      </div>

        {error && (
          <div className="p-4 rounded-xl bg-error-container/10 border border-error/20 text-error text-[13px] flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
            {error}
          </div>
        )}

        {/* ── KPI Bento Grid ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md stagger-children">
          {/* Total Vehicles */}
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-all duration-250 card-hover relative overflow-hidden group animate-fade-in-up">
            <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[80px] text-primary" aria-hidden="true">local_shipping</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Vehicles</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[36px] font-black text-primary leading-none">{vehicles.length}</span>
              <span className="text-[12px] text-green-600 flex items-center font-semibold">
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_upward</span>Live
              </span>
            </div>
            <div className="mt-3 h-1 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Due for Service */}
          <Link href="/maintenance-queue" className="block animate-fade-in-up">
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-all duration-250 card-hover h-full">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Due for Service</p>
                <div className="w-8 h-8 rounded-lg bg-surface-tint/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-surface-tint" aria-hidden="true">build</span>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[36px] font-black text-surface-tint leading-none">{mediumRiskCount + highRiskCount}</span>
              </div>
              <div className="mt-3 h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-surface-tint rounded-full transition-all duration-700" style={{ width: `${Math.round(((mediumRiskCount + highRiskCount) / totalRisks) * 100)}%` }} />
              </div>
            </div>
          </Link>

          {/* Overdue */}
          <Link href="/maintenance-queue" className="block animate-fade-in-up">
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/60 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all duration-250 card-hover h-full">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Overdue</p>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">warning</span>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[36px] font-black text-on-surface leading-none">{highRiskCount}</span>
                <span className="text-[12px] text-on-surface-variant">vehicles</span>
              </div>
            </div>
          </Link>
        </div>

          {/* High Risk */}
          <Link href="/predictive-risk" className="block animate-fade-in-up">
            <div className="p-5 rounded-2xl border border-red-200 border-l-4 border-l-error shadow-sm hover:shadow-md transition-all duration-250 card-hover h-full" style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #ffe4e4 100%)' }}>
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold uppercase tracking-wider text-error/70">High Risk</p>
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-error fill" aria-hidden="true">report</span>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[36px] font-black text-error leading-none">{highRiskCount}</span>
                <span className="text-[12px] text-error/80 font-semibold">immediate</span>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                USD ($)
              </span>
            </div>
          </Link>
        </div>

        {/* ── Main Content Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-lg">

            {/* Bar Chart */}
            <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/40">
                <div>
                  <h3 className="font-bold text-[16px] text-on-surface">Maintenance Expenditures</h3>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">Monthly spending from backend records</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-on-surface-variant">Total (6 mo.)</p>
                  <p className="font-bold text-[15px] text-primary">${monthlyCosts.reduce((s, m) => s + m.cost, 0).toFixed(0)}</p>
                </div>
              </div>
              <div className="flex items-end gap-2 px-2" style={{ height: '220px' }}>
                {/* Y-axis guide lines */}
                <div className="relative flex-1 flex gap-2 items-end h-full">
                  <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none pb-6">
                    {[0,25,50,75,100].map(pct => (
                      <div key={pct} className="w-full border-t border-dashed border-outline-variant/40 flex">
                        <span className="text-[9px] text-on-surface-variant/50 pr-1 -translate-y-2">{pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-end gap-2 w-full h-full relative z-10">
                    {monthlyCosts.map((m, i) => (
                      <ChartBar key={m.name} month={m.name} cost={m.cost} maxCost={maxCost} isLast={i === monthlyCosts.length - 1} index={i} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Recent Service Records Table */}
            <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden animate-fade-in-up">
              <div className="flex justify-between items-center p-5 border-b border-outline-variant/40">
                <div>
                  <h3 className="font-bold text-[15px] text-on-surface">Recent Service Records</h3>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">Live maintenance records history</p>
                </div>
                <Link href="/service-records" className="text-[13px] text-primary font-semibold hover:underline focus-ring rounded px-1">
                  View All →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" role="table">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/40">
                      <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Vehicle</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Service Type</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.slice(0, 6).map((record, idx) => {
                        const vehicle = vehicles.find((v) => v.id === record.vehicle_id);
                        return (
                          <tr
                            key={record.id}
                            className="border-b border-outline-variant/30 hover:bg-surface-container-low/60 transition-colors group cursor-pointer"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <td className="py-3 px-5">
                              <Link href={`/vehicles/${vehicle?.id}`} className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/40 group-hover:bg-primary-fixed transition-colors flex-shrink-0">
                                  <span className="material-symbols-outlined text-[15px] text-on-surface-variant" aria-hidden="true">local_shipping</span>
                                </div>
                                <span className="font-mono text-[13px] font-semibold text-primary hover:underline">{vehicle?.vehicle_number || 'Unknown'}</span>
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-[13px] font-semibold text-on-surface">{record.service_type}</td>
                            <td className="py-3 px-4 text-[12px] text-on-surface-variant">{new Date(record.service_date).toLocaleDateString()}</td>
                            <td className="py-3 px-4 font-mono text-[13px] font-bold text-on-surface text-right">${Number(record.total_cost).toFixed(2)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <span className="material-symbols-outlined text-[36px] text-outline-variant mb-2 block" aria-hidden="true">description</span>
                          <p className="text-[13px] text-on-surface-variant">No service records found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Link href="/service-records" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline">
                View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* Users Directory Table */}
            <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden animate-fade-in-up">
              <div className="p-5 border-b border-outline-variant/40">
                <h3 className="font-bold text-[15px] text-on-surface">Registered User Directory</h3>
                <p className="text-[12px] text-on-surface-variant mt-0.5">Active personnel and organization profiles</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" role="table">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/40">
                      <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Name</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Email</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Role</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((u) => (
                        <tr key={u.id} className="border-b border-outline-variant/30 hover:bg-surface-container-low/60 transition-colors">
                          <td className="py-3 px-5 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden border border-outline-variant/40 flex-shrink-0">
                              <img
                                src={u.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=091426&color=fff&size=64`}
                                alt={u.full_name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=091426&color=fff&size=64`; }}
                              />
                            </div>
                            <span className="font-semibold text-[13px] text-on-surface">{u.full_name}</span>
                          </td>
                          <td className="py-3 px-4 text-[12px] text-on-surface-variant">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant border border-outline-variant/40">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              u.status === 'Active'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[13px] text-on-surface-variant">No users registered.</td>
                      </tr>
                    )
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

          {/* Right Column */}
          <div className="space-y-lg">

            {/* Risk Distribution Donut */}
            <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm p-6 animate-fade-in-up">
              <h3 className="font-bold text-[15px] text-on-surface mb-4">Risk Distribution</h3>
              <div className="flex flex-col items-center">
                <div
                  className="w-44 h-44 relative mb-5 shadow-inner rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(
                      #ba1a1a 0% ${highPct}%,
                      #545f73 ${highPct}% ${highPct + medPct}%,
                      #e0e3e5 ${highPct + medPct}% 100%
                    )`,
                    padding: '3px',
                  }}
                  role="img"
                  aria-label={`Risk distribution: ${highPct}% High, ${medPct}% Medium, ${lowPct}% Low`}
                >
                  <div className="absolute inset-5 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                    <span className="font-black text-[28px] text-primary leading-none">{vehicles.length}</span>
                    <span className="text-[11px] text-on-surface-variant font-medium">Total Assets</span>
                  </div>
                </div>
                <div className="w-full space-y-2">
                  {[
                    { label: 'Low Risk (Healthy)', pct: lowPct, color: '#e0e3e5', textColor: 'text-on-surface' },
                    { label: 'Moderate Risk', pct: medPct, color: '#545f73', textColor: 'text-surface-tint' },
                    { label: 'High Risk', pct: highPct, color: '#ba1a1a', textColor: 'text-error' },
                  ].map(({ label, pct, color, textColor }) => (
                    <div key={label} className="flex justify-between items-center px-3 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} aria-hidden="true" />
                        <span className="text-[12.5px] text-on-surface">{label}</span>
                      </div>
                      <span className={`font-mono font-bold text-[13px] ${textColor}`}>{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Expiry Alerts Form */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Dispatch Expiry Alerts</h3>
              <p className="text-xs font-medium text-slate-500">Send direct 10/7/5 days expiry notices to driver in-app bar</p>
            </div>

            {/* Expiry Dispatcher Form */}
            <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm p-6 animate-fade-in-up">
              <div className="pb-4 border-b border-outline-variant/40 mb-4">
                <h3 className="font-bold text-[15px] text-on-surface">Dispatch Expiry Alerts</h3>
                <p className="text-[12px] text-on-surface-variant mt-0.5">Send manual expiry notices in-app</p>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-4">
                {sendSuccess && (
                  <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-[12px] flex items-center gap-2 animate-fade-in">
                    <span className="material-symbols-outlined text-[16px] text-green-600" aria-hidden="true">check_circle</span>
                    {sendSuccess}
                  </div>
                )}
                {sendError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[12px] flex items-center gap-2 animate-fade-in">
                    <span className="material-symbols-outlined text-[16px] text-red-600" aria-hidden="true">error</span>
                    {sendError}
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-bold text-on-surface mb-1.5">
                    Select Recipient User <span className="text-error">*</span>
                  </label>
                  <select
                    value={targetUserId}
                    onChange={e => setTargetUserId(e.target.value)}
                    required
                    className="w-full bg-surface-container-low rounded-xl border border-outline-variant/60 px-3 py-2 text-[12.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="">— Choose User —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-on-surface mb-1.5">Select Vehicle (Optional)</label>
                  <select
                    value={targetVehicleId}
                    onChange={e => setTargetVehicleId(e.target.value)}
                    className="w-full bg-surface-container-low rounded-xl border border-outline-variant/60 px-3 py-2 text-[12.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="">— Choose Vehicle —</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.vehicle_number} — {v.model}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-on-surface mb-1.5">Type</label>
                    <select
                      value={alertType}
                      onChange={e => setAlertType(e.target.value)}
                      className="w-full bg-surface-container-low rounded-xl border border-outline-variant/60 px-3 py-2 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="Compliance Alert">Compliance</option>
                      <option value="Maintenance Alert">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-on-surface mb-1.5">Expiry Days</label>
                    <select
                      value={expiryDays}
                      onChange={e => setExpiryDays(e.target.value)}
                      className="w-full bg-surface-container-low rounded-xl border border-outline-variant/60 px-3 py-2 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="10">10 Days</option>
                      <option value="7">7 Days</option>
                      <option value="5">5 Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-on-surface mb-1.5">Custom Message (Optional)</label>
                  <textarea
                    placeholder="Leave empty to use auto-generated template..."
                    value={customMsg}
                    onChange={e => setCustomMsg(e.target.value)}
                    rows={3}
                    className="w-full bg-surface-container-low rounded-xl border border-outline-variant/60 px-3 py-2 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingAlert}
                  className="w-full text-white text-[13px] font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer btn-scale border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ background: sendingAlert ? '#6b7280' : 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}
                >
                  {sendingAlert ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[17px]" aria-hidden="true">send</span>
                      Dispatch In-App Alert
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Upcoming Services */}
            <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-outline-variant/40">
                <div>
                  <h3 className="font-bold text-[15px] text-on-surface">Upcoming Services</h3>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">Scheduled service dates</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scrollbar">
                {upcomingServices.length > 0 ? (
                  upcomingServices.map((record) => {
                    const vehicle = vehicles.find((v) => v.id === record.vehicle_id);
                    const nextDate = record.next_service_date ? new Date(record.next_service_date) : null;
                    return (
                      <div key={record.id} className="flex gap-3 group p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex flex-col items-center justify-center font-bold text-[13px] flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                          <span className="text-[11px] opacity-70 leading-none">{nextDate ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][nextDate.getMonth()] : ''}</span>
                          <span className="leading-none">{nextDate ? nextDate.getDate() : '??'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[13px] text-on-surface truncate">{record.service_type}</h4>
                          <p className="text-[11.5px] text-on-surface-variant">{vehicle?.vehicle_number || 'N/A'}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <span className="material-symbols-outlined text-[32px] text-outline-variant mb-1 block" aria-hidden="true">event_available</span>
                    <p className="text-[12px] text-on-surface-variant">No upcoming services scheduled.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
      </div>
    </div>
  );
}
