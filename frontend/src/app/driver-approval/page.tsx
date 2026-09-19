'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { User } from '@/types';

export default function DriverApprovalPage() {
  const router = useRouter();
  const [pendingDrivers, setPendingDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = api.auth.getLocalUser();
    if (currentUser && !['Admin', 'Fleet Manager', 'Manager'].includes(currentUser.role)) {
      router.push('/unauthorized');
      return;
    }

    const fetchPendingDrivers = async () => {
      try {
        setLoading(true);
        // We added status parameter to getUsers
        const drivers = await api.auth.getUsers('Driver', 'Pending');
        setPendingDrivers(drivers);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch pending drivers');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingDrivers();
  }, [router]);

  const handleStatusUpdate = async (driverId: string, newStatus: 'Active' | 'Rejected') => {
    try {
      if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this driver?`)) return;
      
      await api.driver.updateStatus(driverId, newStatus);
      setPendingDrivers(prev => prev.filter(d => d.id !== driverId));
    } catch (err: any) {
      alert(err.message || 'Failed to update driver status');
    }
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="p-lg flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper searchPlaceholder="Search pending drivers...">
      <div className="max-w-7xl mx-auto p-lg md:p-margin-desktop space-y-lg animate-fade-in-up">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant/40 pb-md">
          <div>
            <h1 className="font-display-sm md:font-display-md text-primary font-black tracking-tight">
              Driver Approval
            </h1>
            <p className="font-body-md text-on-surface-variant mt-xs">
              Review and manage pending driver registrations.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-md rounded-xl bg-error-container/10 border border-error-container/30 text-error font-body-sm flex items-center gap-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {pendingDrivers.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-xl text-center shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-sm block">check_circle</span>
            <h3 className="font-headline-sm text-on-surface">No Pending Approvals</h3>
            <p className="font-body-sm text-on-surface-variant mt-xs">All registered drivers have been reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {pendingDrivers.map((driver) => (
              <div key={driver.id} className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-md shadow-sm flex flex-col gap-md">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/50 border border-secondary-container flex items-center justify-center overflow-hidden flex-shrink-0">
                    {driver.profile_picture ? (
                      <img src={driver.profile_picture} alt={driver.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-secondary">person</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-on-surface">{driver.full_name}</h3>
                    <p className="font-body-sm text-on-surface-variant">{driver.email}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-xs font-body-sm text-on-surface-variant bg-surface-container-low p-sm rounded-lg">
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="font-medium text-on-surface">{driver.phone_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registered:</span>
                    <span className="font-medium text-on-surface">{new Date(driver.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-sm mt-auto pt-sm">
                  <button
                    onClick={() => handleStatusUpdate(driver.id, 'Active')}
                    className="flex-1 bg-primary text-on-primary font-label-md py-sm rounded-lg border-none cursor-pointer hover:opacity-90 flex justify-center items-center gap-xs transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(driver.id, 'Rejected')}
                    className="flex-1 bg-error-container text-error font-label-md py-sm rounded-lg border-none cursor-pointer hover:bg-error-container/80 flex justify-center items-center gap-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </LayoutWrapper>
  );
}
