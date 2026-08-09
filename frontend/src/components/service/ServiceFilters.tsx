import React from 'react';
import Link from 'next/link';

export default function ServiceFilters({ search, onSearchChange }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Maintenance Queue
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Manage servicing and maintenance for assigned vehicles.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => onSearchChange(e.target.value)} 
            placeholder="Search vehicles..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>

        <Link href="/service-records">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0">
            <span className="material-symbols-outlined text-[18px]">assignment</span>
            <span>Service Records</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
