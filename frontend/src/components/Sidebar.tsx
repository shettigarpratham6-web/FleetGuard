'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
    { name: 'Service Records', icon: 'description', href: '/service-records' },
    { name: 'Maintenance Queue', icon: 'build_circle', href: '/maintenance-queue' },
    { name: 'Predictive Risk', icon: 'analytics', href: '/predictive-risk' },
    { name: 'Historical Records', icon: 'history', href: '/historical-records' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-45 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-sidebar-width py-lg bg-surface-container-low border-r border-outline-variant flex flex-col flex-shrink-0 transition-transform duration-300 z-50 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-lg mb-xl flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">
              FG
            </div>
            <div>
              <h1 className="font-headline-sm text-headline-sm font-black text-primary">
                FleetGuard
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Logistics Enterprise
              </p>
            </div>
          </div>
          <button
            className="md:hidden text-on-surface-variant p-sm hover:bg-surface-container-high rounded-full"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-sm space-y-sm">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 ease-in-out font-label-md text-label-md ${
                  isActive
                    ? 'bg-secondary-container text-primary border-l-4 border-primary rounded-l-none'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span
                  className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}
                >
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Quick Actions */}
        <div className="px-lg mt-auto pt-lg border-t border-outline-variant space-y-sm">
          <Link href="/service-records/create" onClick={() => setIsOpen(false)}>
            <button className="w-full bg-primary text-on-primary py-sm px-md rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-sm cursor-pointer shadow-sm active:opacity-80">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Service Entry
            </button>
          </Link>
          <nav className="mt-md space-y-xs">
            <a
              href="#"
              className="flex items-center gap-md text-on-surface-variant px-sm py-sm hover:bg-surface-container-high rounded-lg transition-colors font-label-md text-label-md"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
              Support
            </a>
            <a
              href="#"
              className="flex items-center gap-md text-on-surface-variant px-sm py-sm hover:bg-surface-container-high rounded-lg transition-colors font-label-md text-label-md"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Settings
            </a>
          </nav>
        </div>
      </aside>
    </>
  );
}
