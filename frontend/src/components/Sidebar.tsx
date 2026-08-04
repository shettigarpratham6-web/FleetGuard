'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/services/api';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const user = api.auth.getLocalUser();
    if (user) {
      setCurrentUser(user);
      if (user.role) {
        setUserRole(user.role);
      }
    }
  }, []);

  const isAdmin = userRole === 'Admin';
  const isFleetManager = userRole === 'Fleet Manager' || userRole === 'Manager';
  const isMechanic = userRole === 'Service Center' || userRole === 'Mechanic';
  const isDriver = userRole === 'Driver';

  const baseItems = [];

  // All authenticated users can access dashboard
  if (userRole) {
    baseItems.push({ name: 'Dashboard', icon: 'dashboard', href: '/dashboard' });
  }

  // Fleet managers and admins have full fleet management capability
  if (isAdmin || isFleetManager) {
    baseItems.push({ name: 'Register Vehicle', icon: 'add_circle', href: '/vehicles/create' });
    baseItems.push({ name: 'Fleet Management', icon: 'local_shipping', href: '/vehicles' });
    baseItems.push({ name: 'Driver Assignments', icon: 'directions_car', href: '/assignments' });
    baseItems.push({ name: 'Service Logs', icon: 'build', href: '/historical-records' });
    baseItems.push({ name: 'Fleet Analytics', icon: 'bar_chart', href: '/analytics' });
    baseItems.push({ name: 'Predictive Risk', icon: 'timeline', href: '/predictive-risk' });
  }

  // Drivers specific items
  if (isDriver) {
    baseItems.push({ name: 'My Vehicles', icon: 'directions_car', href: '/driver' });
    baseItems.push({ name: 'Compliance', icon: 'verified_user', href: '/driver' });
  }

  // Mechanics specific items
  if (isMechanic) {
    baseItems.push({ name: 'Service Logs', icon: 'build', href: '/historical-records' });
  }

  // Admin panel and notifications
  if (isAdmin) {
    baseItems.push({ name: 'Admin Panel', icon: 'settings', href: '/admin' });
    baseItems.push({ name: 'Notifications', icon: 'notifications', href: '/notifications' });
    baseItems.push({ name: 'Export Reports', icon: 'description', href: '/reports' });
  }

  // Everyone gets About Us and Blog
  baseItems.push({ name: 'About Us', icon: 'info', href: '/about' });
  baseItems.push({ name: 'Blog', icon: 'article', href: '/blog' });

  // Helper to close sidebar on mobile navigation
  const closeSidebarOnMobile = () => {
    if (isOpen) {
      setIsOpen(false);
    }
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
        className={`fixed md:sticky top-0 left-0 h-screen w-sidebar-width py-lg border-r border-outline-variant flex flex-col flex-shrink-0 z-50 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={{
          background: 'linear-gradient(180deg, #f8f6f8 0%, #f3f1f3 100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5 text-xl font-extrabold text-slate-900 tracking-tight">
            <span className="material-symbols-outlined text-[22px] text-blue-600">shield</span>
            <span>FleetGuard</span>
          </div>
          <button
            className="md:hidden text-slate-500 p-1.5 hover:bg-slate-100 rounded-full transition-colors focus:outline-none cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Section Label */}
        <div className="px-6 mb-3 mt-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Navigation
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1" aria-label="Sidebar">
          {baseItems.map((item, index) => {
            const isActive = pathname?.startsWith(item.href) || false;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 w-full rounded-lg text-sm font-semibold text-left transition-all duration-150 focus-ring group relative ${isActive
                  ? 'bg-blue-50 text-blue-700 border-l-[3px] border-blue-600 pl-[11px] font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                onClick={closeSidebarOnMobile}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{
                    color: isActive ? 'var(--md-sys-color-primary)' : 'inherit',
                    transition: 'color 0.2s',
                  }}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="font-label-lg tracking-normal">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-4 py-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {currentUser?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {currentUser?.full_name || 'User'}
              </p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                {userRole || 'Unknown'}
              </p>
            </div>
          </div>
          <button
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-bold hover:bg-red-100 hover:text-red-800 transition-colors cursor-pointer"
            onClick={handleLogout}
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}