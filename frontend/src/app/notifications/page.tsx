'use client';

import React, { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

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

  const is30DaysNotification = (item: any) => {
    const title = (item.title || '').toLowerCase();
    const message = (item.message || '').toLowerCase();
    const score = getUrgencyScore(item);
    return title.includes('30 days') || title.includes('30 day') || message.includes('30 days') || message.includes('30 day') || score === 30;
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

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read", err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications & Alerts</h2>
            <p className="text-slate-500 text-sm mt-1">Real-time alerts ordered by urgency (most urgent & expiring soonest first).</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                {markingAll ? 'Marking All...' : 'Mark All as Read'}
              </button>
            )}
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
              notifications.map((n: any) => {
                const is30Days = is30DaysNotification(n);
                const isOverdue = n.title?.toUpperCase().includes('OVERDUE') || (n.notification_type === 'Compliance Alert' && !is30Days);

                let iconBg = 'bg-blue-100 text-blue-600';
                let iconName = 'notifications';
                let cardStyle = n.is_read ? 'bg-white' : 'bg-blue-50/50 cursor-pointer hover:bg-blue-50';
                let vehicleBadgeStyle = 'bg-slate-100 text-slate-700';

                if (is30Days) {
                  // Yellow theme for 30-day notifications
                  iconBg = 'bg-yellow-100 text-yellow-700 border border-yellow-300';
                  iconName = 'warning';
                  cardStyle = n.is_read ? 'bg-yellow-50/20' : 'bg-yellow-50/80 border-l-4 border-l-yellow-400 cursor-pointer hover:bg-yellow-100/70';
                  vehicleBadgeStyle = 'bg-yellow-100 text-yellow-900 border border-yellow-200';
                } else if (isOverdue) {
                  iconBg = 'bg-rose-100 text-rose-600';
                  iconName = 'warning';
                  cardStyle = n.is_read ? 'bg-white' : 'bg-rose-50/50 cursor-pointer hover:bg-rose-50';
                  vehicleBadgeStyle = 'bg-rose-50 text-rose-700 border border-rose-200';
                }

                return (
                  <div 
                    key={n.id} 
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                    className={`p-5 flex gap-4 items-start transition-colors ${cardStyle}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {iconName}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm ${n.is_read ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>{n.title}</h4>
                          {is30Days && (
                            <span className="text-[10px] uppercase font-black tracking-wider bg-yellow-300 text-yellow-950 px-2 py-0.5 rounded-md shadow-2xs">
                              30 Days Warning
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      {n.vehicle_number && (
                        <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded mt-2 ${vehicleBadgeStyle}`}>
                          Vehicle: {n.vehicle_number}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
