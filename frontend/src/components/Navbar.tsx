'use client';

import React from 'react';
import { mockUsers } from '@/data/mockDb';

interface NavbarProps {
  onMenuClick: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export default function Navbar({
  onMenuClick,
  searchPlaceholder = 'Search vehicles, VINs, or records...',
  searchValue = '',
  onSearchChange,
}: NavbarProps) {
  const manager = mockUsers[0]; // Sarah J.

  return (
    <header className="flex justify-between items-center px-lg py-sm w-full z-45 bg-surface border-b border-outline-variant sticky top-0 flex-shrink-0 bg-surface/90 backdrop-blur-md">
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-md md:hidden">
        <button
          className="p-sm text-on-surface-variant hover:bg-surface-container-high rounded-full cursor-pointer"
          onClick={onMenuClick}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-headline-md text-headline-md font-bold text-primary">
          FleetGuard
        </span>
      </div>

      {/* Search Bar (Desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-md bg-surface-container-low rounded-full px-md py-sm border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <span className="material-symbols-outlined text-on-surface-variant mr-sm text-[20px]">
          search
        </span>
        <input
          className="bg-transparent border-none focus:ring-0 w-full font-body-md text-body-md text-on-surface placeholder-on-surface-variant outline-none"
          placeholder={searchPlaceholder}
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      {/* Utility Actions & User Info */}
      <div className="flex items-center gap-sm ml-auto">
        <button className="p-sm text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors relative cursor-pointer active:opacity-80">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
        </button>
        <button className="p-sm text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors cursor-pointer active:opacity-80 hidden md:block">
          <span className="material-symbols-outlined">settings</span>
        </button>
        
        {/* User Card */}
        <div className="ml-sm pl-sm border-l border-outline-variant flex items-center gap-sm cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant group-hover:border-primary transition-colors">
            <img
              alt={manager.full_name}
              className="w-full h-full object-cover"
              src={manager.profile_picture}
            />
          </div>
          <div className="hidden lg:block">
            <p className="font-label-md text-label-md text-on-surface">
              {manager.full_name}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {manager.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
