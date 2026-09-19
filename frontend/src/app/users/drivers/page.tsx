'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDriversPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the existing robust Drivers page
    router.replace('/drivers');
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
