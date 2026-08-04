'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import AuthCardLayout from '@/components/auth/AuthCardLayout';

export default function ServiceCenterLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      router.replace('/mechanic');
    }
  }, [router]);

  const handleSubmit = async (email: string, pass: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login(email, pass);
      if (res.user.role !== 'Service Center') {
        setError('Unauthorized role for Service Center Portal.');
        api.auth.logout();
      } else {
        router.push('/mechanic');
      }
    } catch (err: any) {
      setError(err.message || 'Service Center authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardLayout
      roleTitle="Service Center Portal"
      roleSubtitle="Select your role or enter credentials to sign in:"
      defaultEmail="mechanic@fleetguard.com"
      defaultPass="mechanic123"
      heroTitle="Streamlined Maintenance & Clock Resets."
      heroSubtitle="Prioritized service queue, job tracking, and automated compliance resets."
      heroTagline="Service Center Command Hub"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      backLinkUrl="/login"
      backLinkLabel="← Switch Portal or Register"
    />
  );
}
