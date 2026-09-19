'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import AuthCardLayout from '@/components/auth/AuthCardLayout';

export default function AdminLoginPage() {
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
      if (res.user.role !== 'Admin') {
        setError('Unauthorized role for Admin Portal. Please use your correct portal.');
        api.auth.logout();
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardLayout
      roleTitle="Admin Portal"
      roleSubtitle="Select your role or enter credentials to sign in:"
      defaultEmail="admin@fleetguard.com"
      defaultPass="admin123"
      heroTitle="Full Control Over Your Entire Fleet."
      heroSubtitle="Comprehensive governance, user roles management, assignment approvals, and audit logs."
      heroTagline="Admin Operations Control Center"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      backLinkUrl="/login"
      backLinkLabel="← Switch Portal or Register"
    />
  );
}
