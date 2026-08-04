'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

export default function UnauthorizedPage() {
  const router = useRouter();
  const user = typeof window !== 'undefined' ? api.auth.getLocalUser() : null;

  const handleGoBack = () => {
    if (!user?.role) {
      router.push('/login');
      return;
    }
    if (user.role === 'Admin' || user.role === 'Fleet Manager' || user.role === 'Manager') {
      router.push('/dashboard');
    } else if (user.role === 'Service Center') {
      router.push('/mechanic');
    } else {
      router.push('/driver');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-[40px] text-rose-500">lock</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">403 — Access Denied</h1>
        <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
          You don&apos;t have permission to view this page. Your role ({user?.role || 'Unknown'}) does not grant access to this module.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleGoBack}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm cursor-pointer border-0 hover:bg-blue-700 shadow-md transition-all"
          >
            Go to My Dashboard
          </button>
          <Link href="/login">
            <button className="px-6 py-2.5 bg-white text-slate-700 rounded-xl font-bold text-sm cursor-pointer border border-slate-200 hover:bg-slate-50 shadow-sm transition-all">
              Sign Out
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}