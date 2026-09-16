'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import ServiceCenterDashboard from '@/components/dashboards/ServiceCenterDashboard';
import Footer from '@/components/footer';
import { api } from '@/services/api';

export default function ServicePage() {
  const router = useRouter();
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

    if (user.role === 'Admin') {
      router.push('/dashboard');
      return;
    } else if (['Fleet Manager', 'Manager'].includes(user.role)) {
      router.push('/dashboard');
      return;
    } else if (user.role === 'Driver') {
      router.push('/driver');
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
          <p className="font-semibold text-sm text-slate-600">Loading Service Center Portal...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="bg-slate-50 min-h-screen">
        <ServiceCenterDashboard />
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <Footer />
        </div>
      </div>
    </LayoutWrapper>
  );
}
