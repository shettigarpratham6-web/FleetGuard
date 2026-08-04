'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CompleteServicePage() {
  const router = useRouter();
  
  useEffect(() => {
    // The Complete Service action is handled via a modal inside the Service Queue.
    router.replace('/service-queue');
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
