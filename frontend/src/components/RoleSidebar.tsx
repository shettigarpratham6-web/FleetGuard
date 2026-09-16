'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/services/api';

interface RoleSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  role?: string;
}

const NAV_ITEMS_BY_ROLE: Record<string, { name: string; icon: string; href: string }[]> = {
  Admin: [
    { name: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
    { name: 'Vehicles', icon: 'directions_car', href: '/vehicles' },
    { name: 'Compliance', icon: 'verified_user', href: '/compliance' },
    { name: 'Service Records', icon: 'description', href: '/service-records' },
    { name: 'Predictive Risk', icon: 'analytics', href: '/predictive-risk' },
    { name: 'Historical Records', icon: 'history', href: '/historical-records' },
    { name: 'Assignments', icon: 'badge', href: '/assignment' },
    { name: 'Checklists', icon: 'fact_check', href: '/checklist' },
    { name: 'About Us', icon: 'info', href: '/about' },
  ],
  'Fleet Manager': [
    { name: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
    { name: 'Vehicles', icon: 'directions_car', href: '/vehicles' },
    { name: 'Assignments', icon: 'badge', href: '/assignment' },
    { name: 'Compliance', icon: 'verified_user', href: '/compliance' },
    { name: 'Service Records', icon: 'description', href: '/service-records' },
    { name: 'Maintenance Queue', icon: 'build_circle', href: '/maintenance-queue' },
    { name: 'Checklists', icon: 'fact_check', href: '/checklist' },
  ],
  Manager: [
    { name: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
    { name: 'Vehicles', icon: 'directions_car', href: '/vehicles' },
    { name: 'Assignments', icon: 'badge', href: '/assignment' },
    { name: 'Compliance', icon: 'verified_user', href: '/compliance' },
    { name: 'Service Records', icon: 'description', href: '/service-records' },
    { name: 'Maintenance Queue', icon: 'build_circle', href: '/maintenance-queue' },
    { name: 'Checklists', icon: 'fact_check', href: '/checklist' },
  ],
  Driver: [
    { name: 'Dashboard', icon: 'dashboard', href: '/driver' },
    { name: 'Checklists', icon: 'fact_check', href: '/checklist' },
    { name: 'About Us', icon: 'info', href: '/about' },
  ],
  'Service Center': [
    { name: 'Dashboard', icon: 'dashboard', href: '/service' },
    { name: 'Maintenance Queue', icon: 'build_circle', href: '/maintenance-queue' },
    { name: 'Service Records', icon: 'description', href: '/service-records' },
    { name: 'Historical Records', icon: 'history', href: '/historical-records' },
    { name: 'About Us', icon: 'info', href: '/about' },
  ],
};

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  Admin: { label: 'System Admin', color: 'bg-rose-600' },
  'Fleet Manager': { label: 'Fleet Manager', color: 'bg-blue-600' },
  Manager: { label: 'Manager', color: 'bg-blue-600' },
  Driver: { label: 'Driver Portal', color: 'bg-emerald-600' },
  'Service Center': { label: 'Service Tech', color: 'bg-amber-500' },
};

export default function RoleSidebar({ isOpen, setIsOpen, role }: RoleSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = NAV_ITEMS_BY_ROLE[role || ''] || NAV_ITEMS_BY_ROLE['Driver'];
  const badge = ROLE_BADGE[role || ''] || { label: 'User', color: 'bg-slate-600' };

  const closeSidebarOnMobile = () => {
    if (isOpen) setIsOpen(false);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    closeSidebarOnMobile();
    api.auth.logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-45 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 py-6 border-r border-slate-200 flex flex-col flex-shrink-0 z-50 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #f8f9fa 0%, #f3f4f6 100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className="px-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-md">
              FG
            </div>
            <div>
              <h1 className="font-black text-[15px] leading-tight text-slate-900">FleetGuard</h1>
              <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full mt-0.5 inline-block ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <button
            className="md:hidden text-slate-500 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Section Label */}
        <div className="px-5 mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Navigation</span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5" aria-label="Sidebar">
          {navItems.map((item, index) => {
            const isActive = pathname?.startsWith(item.href) || false;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-[13px] group relative ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                }`}
                style={{ animationDelay: `${index * 35}ms` }}
                onClick={closeSidebarOnMobile}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                    isActive ? 'fill' : 'group-hover:scale-110'
                  }`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-l-full bg-white/40" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="px-3 pt-4 border-t border-slate-200 space-y-1">
          <Link
            href="/profile"
            onClick={closeSidebarOnMobile}
            className="flex items-center gap-3 text-slate-600 px-3 py-2.5 hover:bg-white hover:text-slate-900 rounded-xl transition-colors text-[13px] font-medium group hover:shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform" aria-hidden="true">
              person
            </span>
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-rose-600 px-3 py-2.5 hover:bg-rose-50 rounded-xl transition-colors text-[13px] font-medium text-left cursor-pointer border-0 bg-transparent group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform" aria-hidden="true">
              logout
            </span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
