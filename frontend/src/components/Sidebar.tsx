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
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
    { name: 'Service Records', icon: 'description', href: '/service-records' },
    { name: 'Maintenance Queue', icon: 'build_circle', href: '/maintenance-queue' },
    { name: 'Predictive Risk', icon: 'analytics', href: '/predictive-risk' },
    { name: 'Historical Records', icon: 'history', href: '/historical-records' },
  ];

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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-sidebar-width py-lg border-r border-outline-variant flex flex-col flex-shrink-0 z-50 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #f8f6f8 0%, #f3f1f3 100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className="px-lg mb-xl flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md"
              style={{ background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)' }}
            >
              FG
            </div>
            <div>
              <h1 className="font-sans font-black text-[16px] leading-tight text-primary">
                FleetGuard
              </h1>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Logistics Enterprise
              </p>
            </div>
          </div>
          <button
            className="md:hidden text-on-surface-variant p-1.5 hover:bg-surface-container-high rounded-full transition-colors focus-ring cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Section Label */}
        <div className="px-lg mb-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
            Navigation
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-sm space-y-xs" aria-label="Sidebar">
          {navItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-md py-[10px] rounded-xl transition-all duration-200 ease-out font-medium text-[13.5px] group relative focus-ring ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
                style={{
                  animationDelay: `${index * 40}ms`,
                }}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-white/40"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                    isActive ? 'fill scale-110' : 'group-hover:scale-110'
                  }`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-lg my-md h-px bg-outline-variant/50" />

        {/* Footer Quick Actions */}
        <div className="px-sm space-y-xs pb-sm">
          <Link
            href="/service-records/create"
            onClick={() => setIsOpen(false)}
            className="focus-ring block rounded-xl"
          >
            <button
              className="w-full py-[10px] px-md rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-md active:shadow-sm btn-scale border-0 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)',
                color: 'white',
              }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              New Service Entry
            </button>
          </Link>

          <nav className="mt-xs space-y-xs" aria-label="Secondary navigation">
            <a
              href="#"
              className="flex items-center gap-3 text-on-surface-variant px-md py-[10px] hover:bg-surface-container-high rounded-xl transition-colors text-[13px] font-medium focus-ring group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform" aria-hidden="true">
                help
              </span>
              Support
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 text-error px-md py-[10px] hover:bg-error-container/15 rounded-xl transition-colors text-[13px] font-medium text-left cursor-pointer focus-ring group border-0 bg-transparent"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform" aria-hidden="true">
                logout
              </span>
              Sign Out
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}
