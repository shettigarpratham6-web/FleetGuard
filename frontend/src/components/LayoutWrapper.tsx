'use client';

import React, { useState, useEffect } from 'react';
import RoleSidebar from './RoleSidebar';
import Navbar from './Navbar';
import { api } from '@/services/api';

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
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const user = api.auth.getLocalUser();
    setUserRole(user?.role);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent">
      {/* Role-Specific Sidebar Navigation */}
      <RoleSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} role={userRole} />

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
        <main
          className="flex-1 overflow-y-auto custom-scrollbar bg-background page-enter"
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
