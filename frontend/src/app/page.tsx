// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
  if (!api.auth.isAuthenticated()) {
    router.replace('/login');
    return;
  }

  const user = api.auth.getLocalUser();

  if (user?.role) {
    router.replace('/dashboard');
  } else {
    router.replace('/login');
  }
}, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}