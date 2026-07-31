'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import { User, Notification } from '@/types';

interface NavbarProps {
  onMenuClick: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export default function Navbar({
  onMenuClick,
  searchPlaceholder = 'Search vehicles, VINs, or records...',
  searchValue = '',
  onSearchChange,
}: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(api.auth.getLocalUser());

    const loadNotifications = async () => {
      if (api.auth.isAuthenticated()) {
        try {
          const list = await api.notifications.getMyNotifications();
          setNotifications(list);
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.is_read);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const getNotifIcon = (type?: string) => {
    if (type === 'Compliance Alert') return { icon: 'warning', color: 'text-error' };
    if (type === 'Maintenance Alert') return { icon: 'build', color: 'text-surface-tint' };
    return { icon: 'notifications', color: 'text-on-surface-variant' };
  };

  return (
    <header
      className="flex justify-between items-center px-lg py-3 w-full z-40 sticky top-0 flex-shrink-0 border-b border-outline-variant/60"
      style={{
        background: 'rgba(251,248,250,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      role="banner"
    >
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-md md:hidden">
        <button
          className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer focus-ring active:scale-95"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined" aria-hidden="true">menu</span>
        </button>
        <span className="font-black text-[16px] text-primary">FleetGuard</span>
      </div>

      {/* Search Bar (Desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-md bg-surface-container-low rounded-2xl px-md py-[9px] border border-outline-variant/70 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 focus-within:bg-white transition-all duration-200 shadow-sm">
        <span className="material-symbols-outlined text-on-surface-variant mr-sm text-[18px]" aria-hidden="true">
          search
        </span>
        <input
          className="bg-transparent border-none focus:ring-0 w-full text-[13.5px] text-on-surface placeholder-on-surface-variant/60 outline-none"
          placeholder={searchPlaceholder}
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          aria-label="Search"
        />
        {searchValue && (
          <button
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent"
            onClick={() => onSearchChange?.('')}
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* Utility Actions & User Info */}
      <div className="flex items-center gap-1 ml-auto">

        {/* Notifications Bell Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all duration-150 relative cursor-pointer active:scale-95 flex items-center justify-center focus-ring group"
            aria-label={`Notifications${unreadNotifications.length > 0 ? `, ${unreadNotifications.length} unread` : ''}`}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform" aria-hidden="true">
              notifications
            </span>
            {unreadNotifications.length > 0 && (
              <span
                className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] bg-error text-white text-[10px] font-bold rounded-full border-2 border-surface flex items-center justify-center px-0.5 relative overflow-visible"
                aria-hidden="true"
              >
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-[360px] bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px] animate-scale-in"
              role="dialog"
              aria-label="Notifications panel"
            >
              {/* Header */}
              <div className="p-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface-container-low/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface fill" aria-hidden="true">notifications</span>
                  <span className="font-bold text-[13.5px] text-on-surface">Notifications</span>
                </div>
                {unreadNotifications.length > 0 && (
                  <span className="text-[11px] bg-primary text-white px-2.5 py-0.5 rounded-full font-bold">
                    {unreadNotifications.length} Unread
                  </span>
                )}
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-outline-variant/40">
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => {
                    const { icon, color } = getNotifIcon(notif.notification_type);
                    return (
                      <div
                        key={notif.id}
                        className={`p-4 transition-all duration-150 flex gap-3 items-start cursor-pointer hover:bg-surface-container-low ${
                          !notif.is_read
                            ? 'bg-primary-fixed/12 border-l-[3px] border-primary'
                            : 'border-l-[3px] border-transparent'
                        }`}
                        style={{ animationDelay: `${idx * 30}ms` }}
                        onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                        role="article"
                        aria-label={notif.title}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!notif.is_read ? 'bg-primary-fixed' : 'bg-surface-container'}`}>
                            <span className={`material-symbols-outlined text-[18px] ${color} ${!notif.is_read ? 'fill' : ''}`} aria-hidden="true">
                              {icon}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-[12.5px] font-semibold text-on-surface leading-snug ${!notif.is_read ? 'font-bold' : ''}`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-on-surface-variant flex-shrink-0 mt-0.5">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-on-surface-variant leading-snug line-clamp-2">
                            {notif.message}
                          </p>
                          {notif.vehicle_number && (
                            <span className="inline-block text-[10px] bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded font-mono mt-0.5">
                              {notif.vehicle_number}
                            </span>
                          )}
                          {!notif.is_read && (
                            <button
                              className="text-[11px] text-primary font-semibold hover:underline block mt-1 focus-ring"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notif.id);
                              }}
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <span className="material-symbols-outlined text-[40px] text-outline-variant mb-2 block" aria-hidden="true">
                      notifications_off
                    </span>
                    <p className="text-[13px] text-on-surface-variant font-medium">All caught up!</p>
                    <p className="text-[11px] text-on-surface-variant/70 mt-1">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          className="p-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all duration-150 cursor-pointer active:scale-95 hidden md:flex items-center justify-center focus-ring group"
          aria-label="Settings"
          title="Settings"
        >
          <span className="material-symbols-outlined text-[22px] group-hover:rotate-45 transition-transform duration-300" aria-hidden="true">
            settings
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-7 bg-outline-variant mx-1 hidden md:block" aria-hidden="true" />

        {/* User Card */}
        {user && (
          <button
            className="flex items-center gap-2.5 pl-2 rounded-xl hover:bg-surface-container-high transition-all duration-150 cursor-pointer group p-1.5 focus-ring active:scale-95 border-0 bg-transparent"
            aria-label={`Logged in as ${user.full_name}`}
          >
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border-2 border-outline-variant group-hover:border-primary/50 transition-colors shadow-sm">
              <img
                alt={user.full_name}
                className="w-full h-full object-cover"
                src={user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=091426&color=fff&size=64`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=091426&color=fff&size=64`;
                }}
              />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-[13px] font-semibold text-on-surface leading-tight">{user.full_name}</p>
              <p className="text-[11px] text-on-surface-variant capitalize leading-tight">{user.role}</p>
            </div>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant hidden lg:block group-hover:text-on-surface transition-colors" aria-hidden="true">
              expand_more
            </span>
          </button>
        )}
      </div>

      <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer active:scale-95 hidden md:block">
        <span className="material-symbols-outlined text-[22px]">settings</span>
      </button>
      
      {/* User Profile */}
      {user && (
        <div className="ml-2 pl-3 border-l border-slate-200 flex items-center gap-2.5 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden ring-2 ring-slate-200 group-hover:ring-blue-600 transition-all">
            <img
              alt={user.full_name}
              className="w-full h-full object-cover"
              src={user.profile_picture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyNWRLx_E1OWgPi7aT-s7keymJamS_sAULSOKC77sBamBVVEH8asmCa3f4NYOaE3mG3geTNRGrCEk9EHHGtRbopLaZ52J0biD4pjdRExkF4tELoYtoq-zasE6so0CeaGSIAvvheeL2qrq5EGlYXYnXy2LFAAHWpIX7MRS7rUU0FgN3ulrekGF7ncrztv17tLcE_3HUrNuSMCnC1wGiBZ6Az6Q7ajamDg6nZkmfN3G0rW9Vloo_heFU'}
            />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {user.full_name}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 capitalize">
              {user.role}
            </p>
          </div>
        </div>
      )}
  </header>
);
}