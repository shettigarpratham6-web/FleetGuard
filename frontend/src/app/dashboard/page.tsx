'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import FleetManagerDashboard from '@/components/dashboards/FleetManagerDashboard';
import Footer from '@/components/footer';
import { api } from '@/services/api';
import { User } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = api.auth.getLocalUser();
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'Driver') {
      router.push('/driver');
      return;
    }

    if (user.role === 'Service Center') {
      router.push('/service');
      return;
    }

    setCurrentUser(user);
    setLoading(false);
  }, [router]);

  if (loading || !currentUser) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-semibold text-sm text-slate-600">Loading Dashboard...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="bg-slate-50 min-h-screen">
        {currentUser.role === 'Admin' ? (
          <AdminDashboard />
        ) : (
          <FleetManagerDashboard />
        )}
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <Footer />
        </div>
      </div>
    </LayoutWrapper>
  );
}