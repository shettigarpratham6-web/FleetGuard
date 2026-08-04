'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import AuthCardLayout from '@/components/auth/AuthCardLayout';

export default function FleetManagerLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (email: string, pass: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login(email, pass);
      if (res.user.role !== 'Fleet Manager' && res.user.role !== 'Manager') {
        setError('Unauthorized role for Fleet Manager Portal.');
        api.auth.logout();
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Fleet Manager authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardLayout
      roleTitle="Fleet Manager Portal"
      roleSubtitle="Select your role or enter credentials to sign in:"
      defaultEmail="manager@fleetguard.com"
      defaultPass="manager123"
      heroTitle="Connect with every vehicle."
      heroSubtitle="Everything you need in an easily customizable dashboard."
      heroTagline="Real-time Fleet Operations Center"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      backLinkUrl="/login"
      backLinkLabel="← Switch Portal or Register"
    />
  );
}
