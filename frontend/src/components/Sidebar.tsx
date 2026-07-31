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
    { name: 'Home', icon: 'home', href: '/home' },
    { name: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
    { name: 'Service Records', icon: 'description', href: '/service-records' },
    { name: 'Maintenance Queue', icon: 'build_circle', href: '/maintenance-queue' },
    { name: 'Predictive Risk', icon: 'analytics', href: '/predictive-risk' },
    { name: 'Historical Records', icon: 'history', href: '/historical-records' },
    { name: 'About Us', icon: 'info', href: '/about' },
    { name: 'Blog', icon: 'article', href: '/blog' },
  ];

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    api.auth.logout();
    router.push('/login');
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    router.push(href);
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
        {/* Brand Header */}
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-blue-500/20">
              FG
            </div>
            <div>
              <h1 className="font-sans font-black text-[16px] leading-tight text-slate-900">
                FleetGuard
              </h1>
              <p className="text-[11px] font-semibold text-slate-500 leading-tight">
                Logistics Enterprise
              </p>
            </div>
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
        <div className="px-6 mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Navigation
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-sm space-y-xs" aria-label="Sidebar">
          {navItems.map((item, index) => {
            const isActive = pathname?.startsWith(item.href) || false;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-md py-[10px] rounded-xl transition-all duration-200 ease-out font-medium text-[13.5px] group relative focus-ring ${isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                style={{
                  animationDelay: `${index * 40}ms`,
                }}
                onClick={(e) => handleNavClick(e, item.href)}
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
                  className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isActive ? 'fill scale-110' : 'group-hover:scale-110'
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
        <div className="mx-6 my-4 h-px bg-slate-200/80" />

        {/* Footer Quick Actions */}
        <div className="px-3 space-y-2 pb-2">
          <Link
            href="/service-records/create"
            onClick={(e) => handleNavClick(e, '/service-records/create')}
            className="focus-ring block rounded-xl"
          >
            <button
              className="w-full py-[10px] px-md rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-md active:shadow-sm btn-scale border-0 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #091426 0%, #1e3a5f 100%)',
                color: 'white',
              }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                add
              </span>
              New Service Entry
            </button>
          </Link>

          <nav className="mt-2 space-y-1" aria-label="Secondary navigation">
            <a
              href="#"
              className="flex items-center gap-3 text-slate-600 px-3.5 py-2.5 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors text-[13px] font-bold group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform" aria-hidden="true">
                help
              </span>
              Support
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 text-rose-600 px-3.5 py-2.5 hover:bg-rose-50 rounded-xl transition-colors text-[13px] font-bold text-left cursor-pointer group border-0 bg-transparent"
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