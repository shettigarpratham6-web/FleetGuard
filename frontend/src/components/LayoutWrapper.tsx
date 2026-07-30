'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutWrapperProps {
  children: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export default function LayoutWrapper({
  children,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
        />

        {/* Dynamic Content Canvas */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
