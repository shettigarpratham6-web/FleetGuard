'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';
import { db } from '@/data/mockDb';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const vehicles = db.getVehicles();
  const serviceRecords = db.getServiceRecords();
  const risks = db.getMaintenanceRisks();

  // Filter recent service records based on search query
  const filteredRecords = serviceRecords.filter(
    (record) =>
      record.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles
        .find((v) => v.id === record.vehicle_id)
        ?.vehicle_number.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

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
              Real-time status of fleet maintenance and health.
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
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 2%
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
                  {risks.filter(r => r.risk_level === 'Medium').length + risks.filter(r => r.risk_level === 'High').length}
                </span>
              </div>
              <div className="mt-md w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-surface-tint h-full w-[45%]"></div>
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
                  {risks.filter(r => r.risk_level === 'High').length}
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
                  {risks.filter(r => r.risk_level === 'High').length}
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
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Maintenance Cost</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Monthly expenditure vs budget</p>
                </div>
                <select className="bg-surface-container-low border border-outline-variant rounded-md font-body-sm text-body-sm py-xs px-sm outline-none focus:ring-1 focus:ring-primary">
                  <option>Last 6 Months</option>
                  <option>YTD</option>
                  <option>Last Year</option>
                </select>
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
                
                {/* Bars */}
                <div className="relative w-full h-full flex items-end justify-between px-lg z-10 pb-8">
                  <div className="flex flex-col items-center w-12 group">
                    <div className="w-full bg-primary-fixed-dim rounded-t-md h-[40%] group-hover:bg-primary-fixed transition-all duration-300 relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">$12k</div>
                    </div>
                    <span className="absolute bottom-0 font-body-sm text-body-sm text-on-surface-variant mt-sm pt-xs">Jan</span>
                  </div>
                  <div className="flex flex-col items-center w-12 group">
                    <div className="w-full bg-primary-fixed-dim rounded-t-md h-[45%] group-hover:bg-primary-fixed transition-all duration-300 relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">$14k</div>
                    </div>
                    <span className="absolute bottom-0 font-body-sm text-body-sm text-on-surface-variant mt-sm pt-xs">Feb</span>
                  </div>
                  <div className="flex flex-col items-center w-12 group">
                    <div className="w-full bg-primary-fixed-dim rounded-t-md h-[30%] group-hover:bg-primary-fixed transition-all duration-300 relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">$9k</div>
                    </div>
                    <span className="absolute bottom-0 font-body-sm text-body-sm text-on-surface-variant mt-sm pt-xs">Mar</span>
                  </div>
                  <div className="flex flex-col items-center w-12 group">
                    <div className="w-full bg-primary-fixed-dim rounded-t-md h-[60%] group-hover:bg-primary-fixed transition-all duration-300 relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">$18k</div>
                    </div>
                    <span className="absolute bottom-0 font-body-sm text-body-sm text-on-surface-variant mt-sm pt-xs">Apr</span>
                  </div>
                  <div className="flex flex-col items-center w-12 group">
                    <div className="w-full bg-primary rounded-t-md h-[85%] relative shadow-md">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">$24k</div>
                    </div>
                    <span className="absolute bottom-0 font-body-sm text-body-sm text-on-surface font-semibold mt-sm pt-xs">May</span>
                  </div>
                  <div className="flex flex-col items-center w-12 group">
                    <div className="w-full bg-surface-variant rounded-t-md h-[50%] border border-dashed border-outline-variant relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Proj: $15k</div>
                    </div>
                    <span className="absolute bottom-0 font-body-sm text-body-sm text-on-surface-variant mt-sm pt-xs">Jun</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Service Records Table */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="flex justify-between items-center p-lg border-b border-outline-variant bg-surface-bright">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Service Records</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Last 7 days activity</p>
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
                      <th className="p-sm font-medium">Status</th>
                      <th className="p-sm pr-lg text-right font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => {
                        const vehicle = vehicles.find((v) => v.id === record.vehicle_id);
                        const isCompleted = record.total_cost > 150 || record.service_type !== 'Transmission Diag.';
                        return (
                          <tr
                            key={record.id}
                            className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group cursor-pointer"
                          >
                            <td className="p-sm pl-lg">
                              <Link href={`/vehicles/${vehicle?.id}`} className="flex items-center gap-sm">
                                <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary-fixed transition-colors">
                                  <span className="material-symbols-outlined text-[16px]">
                                    {vehicle?.vehicle_type === 'Light Van' ? 'directions_car' : 'local_shipping'}
                                  </span>
                                </div>
                                <span className="font-data-mono text-data-mono hover:underline">{vehicle?.vehicle_number}</span>
                              </Link>
                            </td>
                            <td className="p-sm text-on-surface">
                              <Link href={`/service-records/${record.id}`} className="hover:underline">
                                {record.service_type}
                              </Link>
                            </td>
                            <td className="p-sm text-on-surface-variant text-sm">{record.service_date}</td>
                            <td className="p-sm">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isCompleted
                                    ? 'bg-[#dcfce7] text-[#166534]'
                                    : 'bg-[#fef9c3] text-[#854d0e]'
                                }`}
                              >
                                {isCompleted ? 'Completed' : 'In Progress'}
                              </span>
                            </td>
                            <td className="p-sm pr-lg text-right font-data-mono text-data-mono text-on-surface">
                              {isCompleted ? `$${record.total_cost.toFixed(2)}` : '--'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-lg text-center text-on-surface-variant">
                          No recent records match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Risk & Upcoming */}
          <div className="space-y-lg">
            
            {/* Risk Distribution Pie Chart */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-lg">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Risk Distribution</h3>
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 pie-chart relative mb-lg shadow-inner">
                  <div className="absolute inset-4 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center">
                    <span className="font-display-lg text-display-lg text-on-surface">
                      {vehicles.length}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Total Assets</span>
                  </div>
                </div>
                <div className="w-full space-y-xs">
                  <div className="flex justify-between items-center p-sm rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                    <div className="flex items-center gap-sm">
                      <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
                      <span className="font-body-sm text-body-sm text-on-surface">Low Risk (Healthy)</span>
                    </div>
                    <span className="font-data-mono text-data-mono font-bold">55%</span>
                  </div>
                  <div className="flex justify-between items-center p-sm rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                    <div className="flex items-center gap-sm">
                      <div className="w-3 h-3 rounded-full bg-surface-tint"></div>
                      <span className="font-body-sm text-body-sm text-on-surface">Moderate Risk</span>
                    </div>
                    <span className="font-data-mono text-data-mono font-bold">30%</span>
                  </div>
                  <div className="flex justify-between items-center p-sm rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                    <div className="flex items-center gap-sm">
                      <div className="w-3 h-3 rounded-full bg-error"></div>
                      <span className="font-body-sm text-body-sm text-on-surface">High Risk</span>
                    </div>
                    <span className="font-data-mono text-data-mono font-bold text-error">15%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Services List */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-lg flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-md pb-sm border-b border-outline-variant">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Upcoming Services</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Scheduled for next 14 days</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-xs space-y-md">
                
                {/* List Item 1 */}
                <div className="flex gap-md group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-md text-label-md group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      26
                    </div>
                    <div className="w-px h-full bg-outline-variant mt-sm"></div>
                  </div>
                  <div className="flex-1 pb-md">
                    <div className="bg-surface-container-low p-sm rounded-lg border border-transparent group-hover:border-outline-variant transition-colors">
                      <div className="flex justify-between items-start mb-xs">
                        <h4 className="font-label-md text-label-md text-on-surface">Routine Inspection</h4>
                        <span className="font-data-mono text-data-mono text-xs text-on-surface-variant">TRK-102</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span> Oct 26, 09:00 AM
                      </p>
                    </div>
                  </div>
                </div>

                {/* List Item 2 */}
                <div className="flex gap-md group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center font-label-md text-label-md group-hover:bg-primary-fixed group-hover:text-on-primary-fixed transition-colors">
                      28
                    </div>
                    <div className="w-px h-full bg-outline-variant mt-sm"></div>
                  </div>
                  <div className="flex-1 pb-md">
                    <div className="bg-surface-container-low p-sm rounded-lg border border-transparent group-hover:border-outline-variant transition-colors border-l-2 border-l-[#d97706]">
                      <div className="flex justify-between items-start mb-xs">
                        <h4 className="font-label-md text-label-md text-on-surface">Tire Rotation</h4>
                        <span className="font-data-mono text-data-mono text-xs text-on-surface-variant">VAN-304</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span> Oct 28, 01:30 PM
                      </p>
                    </div>
                  </div>
                </div>

                {/* List Item 3 */}
                <div className="flex gap-md group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center font-label-md text-label-md group-hover:bg-primary-fixed group-hover:text-on-primary-fixed transition-colors">
                      02
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-surface-container-low p-sm rounded-lg border border-transparent group-hover:border-outline-variant transition-colors">
                      <div className="flex justify-between items-start mb-xs">
                        <h4 className="font-label-md text-label-md text-on-surface">Engine Diagnostic</h4>
                        <span className="font-data-mono text-data-mono text-xs text-on-surface-variant">TRK-881</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span> Nov 02, 10:00 AM
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </div>

      </div>
    </LayoutWrapper>
  );
}
