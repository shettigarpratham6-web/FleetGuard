'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

export default function DriverDashboard() {
  const router = useRouter();

  const handleSignOut = () => {
    // 1. Clear session token/user data using your API service or localStorage
    if (api?.auth?.logout) {
      api.auth.logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    // 2. Redirect to the login page after clearing storage
    router.push('/login');
  };

  return (
    <div className="p-md md:p-xl space-y-lg max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Driver Workspace
          </h1>
          <p className="font-body-md text-on-surface-variant">
            View your assigned vehicle, active routes, and maintenance status.
          </p>
        </div>

        {/* Updated Sign Out Button */}
        <button
          onClick={handleSignOut}
          type="button"
          className="px-md py-sm bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-body-md text-on-surface transition-all text-center cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      {/* Driver Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="p-md rounded-xl bg-surface-container border border-outline-variant space-y-xs">
          <p className="text-xs text-on-surface-variant font-semibold">Assigned Vehicle</p>
          <p className="text-xl font-bold text-on-surface">Volvo FH16 (FG-1024)</p>
          <span className="inline-block px-2 py-0.5 text-xs bg-success-container/20 text-success rounded-md font-medium">
            Active / Good Condition
          </span>
        </div>

        <div className="p-md rounded-xl bg-surface-container border border-outline-variant space-y-xs">
          <p className="text-xs text-on-surface-variant font-semibold">Next Scheduled Maintenance</p>
          <p className="text-xl font-bold text-on-surface">In 450 km</p>
          <p className="text-xs text-on-surface-variant">Oil & Brake Fluid Service</p>
        </div>

        <div className="p-md rounded-xl bg-surface-container border border-outline-variant space-y-xs">
          <p className="text-xs text-on-surface-variant font-semibold">Shift Hours Today</p>
          <p className="text-xl font-bold text-on-surface">5h 20m</p>
          <p className="text-xs text-on-surface-variant">Within safety compliance</p>
        </div>
      </div>
    </div>
  );
}