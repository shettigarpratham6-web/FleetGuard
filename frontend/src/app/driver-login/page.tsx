'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import AuthCardLayout from '@/components/auth/AuthCardLayout';

export default function DriverLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      router.replace('/driver');
    }
  }, [router]);

  const handleSubmit = async (email: string, pass: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login(email, pass);
      if (res.user.role !== 'Driver') {
        setError('Unauthorized role for Driver Portal.');
        api.auth.logout();
      } else {
        router.push('/driver');
      }
    } catch (err: any) {
      setError(err.message || 'Driver authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardLayout
      roleTitle="Driver Portal"
      roleSubtitle="Select your role or enter credentials to sign in:"
      defaultEmail="driver@fleetguard.com"
      defaultPass="driver123"
      heroTitle="Your Journey & Vehicle Status, Simplified."
      heroSubtitle="Instant duty assignments, compliance tracking, and automated route details."
      heroTagline="Driver Operations Portal"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      backLinkUrl="/login"
      backLinkLabel="← Switch Portal or Register"
    />
  );
}
