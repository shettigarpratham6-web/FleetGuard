'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { Vehicle, MaintenanceRisk, Notification } from '@/types';

// ── Helpers ────────────────────────────────────────────────────────────────────
const daysUntil = (dateStr: string) =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

// ── Sub-components ─────────────────────────────────────────────────────────────
function KPICard({
  label, value, sub, icon, color,
}: { label: string; value: string | number; sub?: string; icon: string; color: string }) {
  return (
    <div className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden border-slate-200`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50`}>
          <span className={`material-symbols-outlined text-[18px] ${color}`}>{icon}</span>
        </div>
      </div>
      <div className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">{value}</div>
      {sub && <p className="text-[11px] font-medium text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {sub && <p className="text-xs text-slate-500 font-medium mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [risks, setRisks] = useState<MaintenanceRisk[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [v, r, c, s, n, u] = await Promise.all([
          api.vehicles.getAll(),
          api.risks.getAll(),
          api.compliance.getAll(),
          api.services.getAll(),
          api.notifications.getMyNotifications(),
          api.auth.getUsers(),
        ]);
        setVehicles(v || []);
        setRisks(r || []);
        setComplianceDocs(c || []);
        setServiceRecords(s || []);
        setNotifications(n || []);
        setUsers(u || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        <p className="font-semibold text-sm text-slate-600">Loading Admin Dashboard...</p>
      </div>
    );
  }

  // ── Computed Metrics ────────────────────────────────────────────────────────
  const activeVehicles = vehicles.filter(v => v.status === 'Available' || v.status === 'Assigned').length;
  const inServiceVehicles = vehicles.filter(v => v.status === 'Maintenance').length;
  const nonCompliantVehicles = vehicles.filter((v: any) => v.compliance_status === 'Non-Compliant').length;

  const highRisk = risks.filter(r => r.risk_level === 'High').length;
  const medRisk = risks.filter(r => r.risk_level === 'Medium').length;
  const lowRisk = risks.filter(r => r.risk_level === 'Low').length;
  const totalRisks = risks.length || 1;

  const insurance = complianceDocs.filter(d => d.document_type === 'Insurance');
  const inspection = complianceDocs.filter(d => d.document_type === 'Inspection');
  const puc = complianceDocs.filter(d => d.document_type === 'PUC');
  const expiringInsurance = insurance.filter(d => d.expiry_date && daysUntil(d.expiry_date) <= 30 && daysUntil(d.expiry_date) >= 0).length;
  const expiringInspection = inspection.filter(d => d.expiry_date && daysUntil(d.expiry_date) <= 30 && daysUntil(d.expiry_date) >= 0).length;
  const expiringPUC = puc.filter(d => d.expiry_date && daysUntil(d.expiry_date) <= 30 && daysUntil(d.expiry_date) >= 0).length;
  const overdueCount = complianceDocs.filter(d => d.expiry_date && daysUntil(d.expiry_date) < 0).length;

  const totalCost = serviceRecords.reduce((s, r) => s + (Number(r.total_cost) || 0), 0);

  // Upcoming expiries within 30 days
  const upcomingExpiries = complianceDocs
    .filter(d => d.expiry_date && daysUntil(d.expiry_date) >= 0 && daysUntil(d.expiry_date) <= 30)
    .sort((a, b) => daysUntil(a.expiry_date) - daysUntil(b.expiry_date))
    .slice(0, 8);

  // Recent notifications
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  const getMonthlyCosts = () => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { name: d.toLocaleString('default', { month: 'short' }), month: d.getMonth(), year: d.getFullYear(), cost: 0 };
    });
    serviceRecords.forEach(r => {
      const d = new Date(r.service_date);
      const m = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (m) m.cost += Number(r.total_cost) || 0;
    });
    return months;
  };
  const monthlyCosts = getMonthlyCosts();
  const maxCost = Math.max(...monthlyCosts.map(m => m.cost), 500);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600 block mb-1">System Admin</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h2>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Full fleet visibility — real-time data
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/vehicles/create">
            <button className="bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[18px] text-rose-600">directions_car</span>
              Add Vehicle
            </button>
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">summarize</span>
            Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {error}
        </div>
      )}

      {/* ── Fleet Overview KPIs ────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Fleet Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Vehicles" value={vehicles.length} sub="All registered assets" icon="local_shipping" color="text-blue-600" />
          <KPICard label="Active Vehicles" value={activeVehicles} sub="Available & assigned" icon="directions_car" color="text-emerald-600" />
          <KPICard label="Non-Compliant" value={nonCompliantVehicles} sub="Documents expired" icon="gavel" color="text-rose-600" />
          <KPICard label="In Service" value={inServiceVehicles} sub="Under maintenance" icon="build" color="text-amber-600" />
        </div>
      </div>

      {/* ── Compliance Analytics + Maintenance ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Analytics */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <SectionHeader
            title="Compliance Analytics"
            sub="Documents expiring within 30 days"
            action={
              <Link href="/compliance" className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1">
                View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Insurance', count: expiringInsurance, icon: 'shield', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Inspection Certs', count: expiringInspection, icon: 'verified', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'PUC / Pollution', count: expiringPUC, icon: 'eco', color: 'text-teal-600', bg: 'bg-teal-50' },
              { label: 'Overdue Docs', count: overdueCount, icon: 'warning', color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map(item => (
              <div key={item.label} className={`p-4 rounded-xl ${item.bg} border border-slate-100`}>
                <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-2 shadow-sm`}>
                  <span className={`material-symbols-outlined text-[18px] ${item.color}`}>{item.icon}</span>
                </div>
                <div className={`text-2xl font-extrabold ${item.color}`}>{item.count}</div>
                <p className="text-[11px] font-semibold text-slate-600 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Upcoming expiries table */}
          <div className="mt-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Upcoming Expiries</p>
            {upcomingExpiries.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Document Type</th>
                      <th className="px-4 py-2.5">Expires</th>
                      <th className="px-4 py-2.5">Days Left</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {upcomingExpiries.map((doc, i) => {
                      const days = daysUntil(doc.expiry_date);
                      const urgency = days <= 7 ? 'bg-rose-50 text-rose-700 border-rose-200' : days <= 15 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200';
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{doc.document_type}</td>
                          <td className="px-4 py-2.5 text-slate-600 font-mono">{new Date(doc.expiry_date).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full border font-bold text-[10px] ${urgency}`}>{days}d</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${days <= 7 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                              {days <= 7 ? 'Critical' : 'Warning'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                <span className="material-symbols-outlined text-[36px] block mb-2">check_circle</span>
                No documents expiring in the next 30 days
              </div>
            )}
          </div>
        </div>

        {/* Predictive Maintenance Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <SectionHeader title="Predictive Maintenance" sub="AI risk distribution" />
            <div
              className="w-36 h-36 rounded-full mx-auto mb-5 relative flex items-center justify-center shadow-inner"
              style={{
                background: `conic-gradient(#ef4444 0% ${Math.round((highRisk / totalRisks) * 100)}%, #f59e0b ${Math.round((highRisk / totalRisks) * 100)}% ${Math.round(((highRisk + medRisk) / totalRisks) * 100)}%, #10b981 ${Math.round(((highRisk + medRisk) / totalRisks) * 100)}% 100%)`,
              }}
            >
              <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                <span className="text-xl font-extrabold text-slate-900">{risks.length}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Tracked</span>
              </div>
            </div>
            {[
              { label: 'Low Risk', count: lowRisk, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
              { label: 'Medium Risk', count: medRisk, color: 'bg-amber-400', textColor: 'text-amber-700' },
              { label: 'High Risk', count: highRisk, color: 'bg-rose-500', textColor: 'text-rose-700' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                </div>
                <span className={`font-extrabold text-sm ${item.textColor}`}>{item.count}</span>
              </div>
            ))}
            <Link href="/predictive-risk" className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors">
              View Details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          {/* Fleet Cost Placeholder */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-md">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Service Cost</p>
            <div className="text-2xl font-extrabold">{fmtCurrency(totalCost)}</div>
            <p className="text-[11px] text-slate-400 mt-1">Year-to-date across {serviceRecords.length} services</p>
            <Link href="/service-records" className="mt-3 text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View Records <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Cost Chart ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <SectionHeader title="Monthly Service Expenditure" sub="Last 6 months — cost from service records" />
        <div className="flex items-end gap-3 h-40 mt-4">
          {monthlyCosts.map((m, i) => {
            const pct = Math.max(Math.round((m.cost / maxCost) * 100), 4);
            const isLast = i === monthlyCosts.length - 1;
            return (
              <div key={m.name} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                <span className="absolute -top-6 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {fmtCurrency(m.cost)}
                </span>
                <div
                  style={{ height: `${pct}%` }}
                  className={`w-full rounded-t-lg transition-all duration-500 ${isLast ? 'bg-rose-600 shadow-md shadow-rose-500/20' : 'bg-rose-100 group-hover:bg-rose-400'}`}
                />
                <span className={`text-[11px] font-semibold ${isLast ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>{m.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Notifications + Recent Activity ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Center */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <SectionHeader
            title="Notifications Center"
            sub={`${unreadNotifs} unread alert${unreadNotifs !== 1 ? 's' : ''}`}
          />
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.slice(0, 6).map(n => (
                <div key={n.id} className={`p-3 rounded-xl border text-xs ${!n.is_read ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="font-bold text-slate-900 truncate">{n.title}</p>
                  <p className="text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                  <p className="text-slate-400 mt-1 font-mono">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <span className="material-symbols-outlined text-[36px] block mb-2">notifications_off</span>
                <p className="text-sm font-medium">No notifications</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <SectionHeader
            title="Recent Service Activity"
            sub="Latest maintenance logs"
            action={
              <Link href="/service-records" className="text-xs font-bold text-rose-600 hover:underline">View All</Link>
            }
          />
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {serviceRecords.length > 0 ? (
              serviceRecords.slice(0, 5).map(r => {
                const v = vehicles.find(v => v.id === r.vehicle_id);
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-rose-600">build</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{v?.vehicle_number || 'Vehicle'}</p>
                        <p className="text-[11px] text-slate-500">{r.service_type}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 font-mono">{fmtCurrency(r.total_cost)}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <span className="material-symbols-outlined text-[36px] block mb-2">history</span>
                <p className="text-sm font-medium">No service records yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── User Directory summary ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <SectionHeader
          title="System Users"
          sub={`${users.length} registered users across all roles`}
          action={<span className="text-xs font-bold text-slate-500">{users.filter((u: any) => u.status === 'Active').length} Active</span>}
        />
        <div className="flex flex-wrap gap-2">
          {(['Admin', 'Fleet Manager', 'Driver', 'Service Center'] as const).map(role => {
            const count = users.filter((u: any) => u.role === role || (role === 'Fleet Manager' && u.role === 'Manager')).length;
            const colors: Record<string, string> = {
              Admin: 'bg-rose-50 text-rose-700 border-rose-200',
              'Fleet Manager': 'bg-blue-50 text-blue-700 border-blue-200',
              Driver: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              'Service Center': 'bg-amber-50 text-amber-700 border-amber-200',
            };
            return (
              <div key={role} className={`px-4 py-2 rounded-xl border text-sm font-bold ${colors[role]}`}>
                {count} {role}{count !== 1 ? 's' : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
