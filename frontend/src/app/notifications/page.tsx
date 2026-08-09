'use client';

import React, { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to score notification urgency: Overdue (0) -> Expiring soonest (1, 4, 6, 7, 10, 15, 30 days)
  const getUrgencyScore = (item: any) => {
    const title = item.title || '';
    if (title.toUpperCase().startsWith('OVERDUE')) {
      return 0; // Overdue items at the top
    }
    const match = title.match(/in (\d+) Days/i);
    if (match) {
      return parseInt(match[1], 10); // Expiring soonest first
    }
    return 999;
  };

  const sortNotificationsByUrgency = (list: any[]) => {
    return [...list].sort((a, b) => {
      const scoreA = getUrgencyScore(a);
      const scoreB = getUrgencyScore(b);
      if (scoreA !== scoreB) {
        return scoreA - scoreB; // Lower score (expiring first) comes at the beginning
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const fetchNotifications = async () => {
    try {
      // Trigger scan on load to guarantee fresh alerts for all expiring fleet items
      await api.triggerExpiryScan().catch(() => {});
      const list = await api.notifications.getMyNotifications();
      
      // Deduplicate by unique (title + vehicle_id) keeping latest
      const latestMap = new Map();
      for (const item of list || []) {
        const key = `${item.title}_${item.vehicle_id || item.id}`;
        if (!latestMap.has(key)) {
          latestMap.set(key, item);
        }
      }
      const deduplicated = Array.from(latestMap.values());
      const sorted = sortNotificationsByUrgency(deduplicated);
      setNotifications(sorted);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications & Alerts</h2>
            <p className="text-slate-500 text-sm mt-1">Real-time alerts ordered by urgency (most urgent & expiring soonest first).</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchNotifications}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Refresh Scan
            </button>
            {notifications.some(n => !n.is_read) && (
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {notifications.filter(n => !n.is_read).length} Unread
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium">You have no new notifications. All vehicles are in compliance!</div>
            ) : (
              notifications.map((n: any) => (
                <div 
                  key={n.id} 
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`p-5 flex gap-4 items-start transition-colors ${n.is_read ? 'bg-white' : 'bg-blue-50/50 cursor-pointer hover:bg-blue-50'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.notification_type === 'Compliance Alert' || n.title?.includes('OVERDUE') ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {n.notification_type === 'Compliance Alert' || n.title?.includes('OVERDUE') ? 'warning' : 'notifications'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-sm ${n.is_read ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>{n.title}</h4>
                      <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    {n.vehicle_number && (
                      <span className="inline-block text-[10px] font-bold font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded mt-2">
                        Vehicle: {n.vehicle_number}
                      </span>
                    )}
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
