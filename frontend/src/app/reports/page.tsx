'use client';

import React, { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { 
  Download, 
  FileText, 
  Printer, 
  CheckCircle, 
  RefreshCw, 
  FileSpreadsheet, 
  ShieldCheck, 
  Wrench, 
  Truck, 
  Users 
} from 'lucide-react';

export default function ReportsPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [exportingReport, setExportingReport] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<'performance' | 'compliance' | 'maintenance' | 'assignments' | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [vData, cData, sData, aData, uData] = await Promise.all([
        api.vehicles.getAll().catch(() => []),
        api.compliance.getAll().catch(() => []),
        api.services.getAll().catch(() => []),
        api.assignments?.getAll?.().catch(() => []) || Promise.resolve([]),
        api.auth.getUsers().catch(() => [])
      ]);

      setVehicles(vData || []);
      setComplianceDocs(cData || []);
      setServiceRecords(Array.isArray(sData) ? sData : (sData as any)?.records || []);
      setAssignments(aData || []);
      setUsers(uData || []);
    } catch (err) {
      console.error('Failed to load database items for reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // CSV Generator Utility
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`Successfully exported ${filename}.csv`);
  };

  // PDF Print Generator Utility
  const printReport = (title: string, headers: string[], rows: (string | number)[][]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - FleetGuard Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; }
            .title { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            .meta { font-size: 12px; color: #64748b; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 800; color: #334155; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; pt: 16px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">FleetGuard Logistics</div>
              <div class="title">${title}</div>
            </div>
            <div class="meta">
              <div>Generated: ${new Date().toLocaleString()}</div>
              <div>System Confidential</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell ?? '-'}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
          <div class="footer">
            <span>FleetGuard Operations System</span>
            <span>Total Records: ${rows.length}</span>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    showNotification(`Opened printable view for ${title}`);
  };

  // Report Builders
  const getFleetPerformanceData = () => {
    const headers = ['Vehicle ID', 'Vehicle Number', 'Registration', 'Current Mileage (km)', 'Risk Level', 'Status'];
    const rows = vehicles.map(v => [
      v.id,
      v.vehicle_number || 'N/A',
      v.registration_number || 'N/A',
      v.current_mileage || 0,
      v.maintenance_risk || 'Low',
      v.status || 'Active'
    ]);
    return { headers, rows };
  };

  const getComplianceData = () => {
    const headers = ['Vehicle ID', 'Document Type', 'Document Number', 'Issue Date', 'Expiry Date', 'Status'];
    const now = new Date();
    const rows = complianceDocs.map(d => {
      const isExpired = new Date(d.expiry_date) < now;
      return [
        d.vehicle_id,
        d.document_type,
        d.document_number || 'N/A',
        d.issue_date || 'N/A',
        d.expiry_date ? d.expiry_date.slice(0, 10) : 'N/A',
        isExpired ? 'EXPIRED' : 'VALID'
      ];
    });
    return { headers, rows };
  };

  const getMaintenanceCostData = () => {
    const headers = ['Record ID', 'Vehicle ID', 'Service Date', 'Service Type', 'Mileage', 'Labour Cost (INR)', 'Parts Cost (INR)', 'Total Cost (INR)'];
    const rows = serviceRecords.map(s => {
      const labour = Number(s.labour_cost) || 0;
      const parts = Number(s.parts_cost) || 0;
      const total = Number(s.total_cost) || (labour + parts);
      return [
        s.id,
        s.vehicle_id,
        s.service_date ? s.service_date.slice(0, 10) : 'N/A',
        s.service_type || 'Maintenance',
        s.current_mileage || 0,
        labour.toFixed(2),
        parts.toFixed(2),
        total.toFixed(2)
      ];
    });
    return { headers, rows };
  };

  const getAssignmentsData = () => {
    const headers = ['Vehicle ID', 'Assigned Driver', 'Driver Email', 'Status'];
    const rows = assignments.map(a => [
      a.vehicle_id,
      a.driver_name || a.username || 'Unassigned',
      a.driver_email || a.email || 'N/A',
      a.status || 'Active'
    ]);
    return { headers, rows };
  };

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Reports Engine</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Exports & Reports</h1>
            <p className="text-slate-500 text-sm mt-1">Export real-time operational datasets into CSV and printable PDF reports.</p>
          </div>
          <button
            onClick={loadReportData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Datasets
          </button>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold">{notification}</span>
          </div>
        )}

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. Fleet Performance Report */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-5 hover:border-blue-300 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Monthly Fleet Performance</h3>
                <p className="text-sm text-slate-500 mt-1">Aggregated vehicle mileage, health status, and operational risk metrics.</p>
              </div>
              <div className="text-xs font-semibold text-slate-400">Total Items: {vehicles.length} records</div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const { headers, rows } = getFleetPerformanceData();
                  downloadCSV('monthly_fleet_performance', headers, rows);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={() => {
                  const { headers, rows } = getFleetPerformanceData();
                  printReport('Monthly Fleet Performance Report', headers, rows);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> PDF/Print
              </button>
            </div>
          </div>

          {/* 2. Compliance Audit Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-5 hover:border-emerald-300 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Compliance Audit Log</h3>
                <p className="text-sm text-slate-500 mt-1">Complete compliance document verification history and expiration audits.</p>
              </div>
              <div className="text-xs font-semibold text-slate-400">Total Items: {complianceDocs.length} records</div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const { headers, rows } = getComplianceData();
                  downloadCSV('compliance_audit_log', headers, rows);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={() => {
                  const { headers, rows } = getComplianceData();
                  printReport('Compliance Audit Log Report', headers, rows);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> PDF/Print
              </button>
            </div>
          </div>

          {/* 3. Maintenance Cost Analysis */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-5 hover:border-amber-300 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Maintenance Cost Analysis</h3>
                <p className="text-sm text-slate-500 mt-1">Financial breakdown of repair jobs, parts replaced, and labor expenditure.</p>
              </div>
              <div className="text-xs font-semibold text-slate-400">Total Items: {serviceRecords.length} records</div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const { headers, rows } = getMaintenanceCostData();
                  downloadCSV('maintenance_cost_analysis', headers, rows);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={() => {
                  const { headers, rows } = getMaintenanceCostData();
                  printReport('Maintenance Cost Analysis Report', headers, rows);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> PDF/Print
              </button>
            </div>
          </div>

          {/* 4. Driver & Vehicle Assignments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-5 hover:border-violet-300 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Driver Assignments Summary</h3>
                <p className="text-sm text-slate-500 mt-1">List of driver allocations, assigned fleet assets, and contact details.</p>
              </div>
              <div className="text-xs font-semibold text-slate-400">Total Items: {assignments.length} records</div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const { headers, rows } = getAssignmentsData();
                  downloadCSV('driver_assignments_summary', headers, rows);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={() => {
                  const { headers, rows } = getAssignmentsData();
                  printReport('Driver & Vehicle Assignments Summary', headers, rows);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> PDF/Print
              </button>
            </div>
          </div>

        </div>
      </div>
    </LayoutWrapper>
  );
}
