'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import AuthCardLayout from '@/components/auth/AuthCardLayout';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      const user = api.auth.getLocalUser();
      if (user?.role) {
        if (user.role === 'Admin' || user.role === 'Fleet Manager' || user.role === 'Manager') {
          router.replace('/dashboard');
        } else if (user.role === 'Service Center') {
          router.replace('/mechanic');
        } else {
          router.replace('/driver');
        }
      }
    }
  }, [router]);

  const handleSubmit = async (email: string, pass: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login(email, pass);
      const role = res.user.role;

      if (role === 'Admin' || role === 'Fleet Manager' || role === 'Manager') {
        router.push('/dashboard');
      } else if (role === 'Service Center') {
        router.push('/mechanic');
      } else if (role === 'Driver') {
        router.push('/driver');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardLayout
      roleTitle="Fleet Operations Portal"
      roleSubtitle="Select your role from the 2x2 grid below or enter details to log in:"
      defaultEmail="manager@fleetguard.com"
      defaultPass="manager123"
      heroTitle="Connect with every vehicle."
      heroSubtitle="Everything you need in an easily customizable dashboard."
      heroTagline="Real-time Fleet Operations Center"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      backLinkUrl="/register"
      backLinkLabel="Don't have an account? Create an account"
    />
  );
}