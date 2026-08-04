import React from 'react';

export default function ServiceFilters({ search, onSearchChange }: any) {
  return (
    <div className="flex justify-between items-center pb-4 border-b border-slate-200">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Maintenance Queue
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Manage servicing and maintenance for assigned vehicles.
        </p>
      </div>
      <div className="relative w-72">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
        <input 
          type="text" 
          value={search} 
          onChange={(e) => onSearchChange(e.target.value)} 
          placeholder="Search vehicles..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
