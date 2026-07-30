'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/services/api';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', href: '/driver' },
    { name: 'Service Records', icon: 'description', href: '/service-records' },
    { name: 'Maintenance Queue', icon: 'build_circle', href: '/maintenance-queue' },
    { name: 'Predictive Risk', icon: 'analytics', href: '/predictive-risk' },
    { name: 'Historical Records', icon: 'history', href: '/historical-records' },
    { name: 'About Us', icon: 'phone', href:'/about'}
  ];

  const router = useRouter();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    api.auth.logout();
    router.push('/login');
  };
return (
  <>
    {/* Mobile Backdrop */}
    {isOpen && (
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-45 md:hidden transition-opacity"
        onClick={() => setIsOpen(false)}
      />
    )}

    {/* Sidebar Panel */}
    <aside
      className={`fixed md:sticky top-0 left-0 h-screen w-64 py-6 bg-slate-50 border-r border-slate-200/90 flex flex-col flex-shrink-0 transition-transform duration-300 z-50 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="px-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-blue-500/20">
            FG
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
              FleetGuard
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              Logistics Enterprise
            </p>
          </div>
        </div>
        <button
          className="md:hidden text-slate-500 p-1.5 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          onClick={() => setIsOpen(false)}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ease-in-out text-xs font-bold ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 rounded-l-none'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  isActive ? 'fill text-blue-600' : 'text-slate-400'
                }`}
              >
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Quick Actions */}
      <div className="px-4 mt-auto pt-4 border-t border-slate-200/90 space-y-3">
        <Link href="/service-records/create" onClick={() => setIsOpen(false)} className="block">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Service Entry
          </button>
        </Link>
        <nav className="space-y-1 pt-1">
          <a
            href="#"
            className="flex items-center gap-3 text-slate-600 px-3 py-2 hover:bg-slate-200/50 hover:text-slate-900 rounded-xl transition-colors text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-400">help</span>
            Support
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-rose-600 px-3 py-2 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-rose-600">logout</span>
            Sign Out
          </button>
        </nav>
      </div>
    </aside>
  </>
);
}