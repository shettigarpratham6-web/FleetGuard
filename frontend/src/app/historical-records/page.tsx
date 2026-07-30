'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { mockHistoricalServices } from '@/data/mockDb';

export default function HistoricalRecordsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<any[]>(mockHistoricalServices);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistoricalRecords = async () => {
      try {
        setLoading(true);
        const data = await api.historicalServices.getAll();
        if (data && Array.isArray(data) && data.length > 0) {
          setRecords(data);
        }
      } catch (err) {
        console.error('Error fetching historical records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistoricalRecords();
  }, []);

  // Filtering Logic
  const filteredRecords = records.filter((record) => {
    return (
      (record.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.remarks || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.vehicle_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <LayoutWrapper
      searchPlaceholder="Search records..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="p-margin-mobile md:p-margin-desktop flex-1 flex flex-col gap-lg max-w-[1600px] mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant/30 pb-md">
          <div>
            <h2 className="font-display-lg text-display-lg text-primary">Historical Records</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
              Manage legacy and manually entered maintenance data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-sm">
            <button className="flex items-center gap-xs px-md py-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface font-label-md hover:bg-surface-container-high transition-colors cursor-pointer">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                filter_list
              </span>
              Filter
            </button>
            <button
              onClick={() => alert('Bulk migration tool launched. Upload legacy CSV files.')}
              className="flex items-center gap-xs px-md py-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface font-label-md hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                upload_file
              </span>
              Bulk Import
            </button>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-surface-container-low sticky top-0 z-10 shadow-[0_1px_0_0_#e4e2e3]">
                <tr className="text-on-surface-variant font-label-md text-label-md uppercase">
                  <th className="py-md px-lg font-medium">Date</th>
                  <th className="py-md px-lg font-medium">Asset ID</th>
                  <th className="py-md px-lg font-medium">Service Description</th>
                  <th className="py-md px-lg font-medium">Legacy ID / Source</th>
                  <th className="py-md px-lg font-medium text-right">Mileage</th>
                  <th className="py-md px-lg font-medium">Remarks</th>
                  <th className="py-md px-lg font-medium">Status</th>
                  <th className="py-md px-lg font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface-container-lowest font-data-mono text-data-mono">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className="hover:bg-surface-container-lowest transition-colors group"
                    >
                      <td className="py-md px-lg text-on-surface">{record.service_date}</td>
                      <td className="py-md px-lg">
                        <div className="flex items-center gap-sm">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <span className="font-body-md font-semibold text-primary">
                            {record.vehicle_id === 'v1' ? 'TX-8492' : 'NY-1104'}
                          </span>
                        </div>
                      </td>
                      <td className="py-md px-lg font-body-md text-on-surface">
                        {record.description}
                      </td>
                      <td className="py-md px-lg text-on-surface-variant">
                        {index === 0 ? 'SYS_MIG_001' : index === 1 ? 'PAPER_LOG_42' : 'API_SYNC_7'}
                      </td>
                      <td className="py-md px-lg text-right text-on-surface">
                        {record.mileage.toLocaleString()} mi
                      </td>
                      <td className="py-md px-lg text-on-surface-variant font-body-sm">
                        {record.remarks || 'N/A'}
                      </td>
                      <td className="py-md px-lg">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-[#e0f2fe] text-[#0369a1]">
                          Archived
                        </span>
                      </td>
                      <td className="py-md px-lg text-center">
                        <div className="flex justify-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            className="p-1 rounded hover:bg-surface-container-high text-error cursor-pointer"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-lg text-center text-on-surface-variant">
                      No historical records match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-md border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between mt-auto">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Showing {filteredRecords.length} of {mockHistoricalServices.length} records
            </span>
            <div className="flex gap-sm">
              <button
                className="px-sm py-1 border border-outline-variant rounded bg-surface hover:bg-surface-container text-on-surface font-body-sm disabled:opacity-50"
                disabled
              >
                Prev
              </button>
              <button
                className="px-sm py-1 border border-outline-variant rounded bg-surface hover:bg-surface-container text-on-surface font-body-sm disabled:opacity-50"
                disabled
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
