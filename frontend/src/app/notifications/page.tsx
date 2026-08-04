'use client';
import React, { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/notifications`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}` }
        });
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h2>
          <p className="text-slate-500 text-sm mt-1">Recent alerts and system updates.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium">You have no new notifications.</div>
            ) : (
              notifications.map((n: any) => (
                <div key={n.id} className={`p-4 flex gap-4 items-start ${n.is_read ? 'bg-white' : 'bg-blue-50/50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === 'Alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <span className="material-symbols-outlined text-[20px]">{n.type === 'Alert' ? 'warning' : 'notifications'}</span>
                  </div>
                  <div>
                    <h4 className={`text-sm ${n.is_read ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>{n.title || n.message}</h4>
                    <p className="text-xs text-slate-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
