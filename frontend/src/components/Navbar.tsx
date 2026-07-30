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
    // Poll notifications every 10 seconds for real-time alerts
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

  return (
    <header className="flex justify-between items-center px-lg py-sm w-full z-45 bg-[#0a0e17]/80 border-b border-white/10 sticky top-0 flex-shrink-0 backdrop-blur-md">
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-md md:hidden">
        <button
          className="p-sm text-on-surface-variant hover:bg-surface-container-high rounded-full cursor-pointer"
          onClick={onMenuClick}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-headline-md text-headline-md font-bold text-primary">
          FleetGuard
        </span>
      </div>

      {/* Search Bar (Desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-md bg-surface-container-low rounded-full px-md py-sm border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <span className="material-symbols-outlined text-on-surface-variant mr-sm text-[20px]">
          search
        </span>
        <input
          className="bg-transparent border-none focus:ring-0 w-full font-body-md text-body-md text-on-surface placeholder-on-surface-variant outline-none"
          placeholder={searchPlaceholder}
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      {/* Utility Actions & User Info */}
      <div className="flex items-center gap-sm ml-auto relative">
        {/* Notifications Bell Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-sm text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors relative cursor-pointer active:opacity-80 flex items-center justify-center"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] bg-error text-white text-[10px] font-bold rounded-full border border-surface flex items-center justify-center px-0.5">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-sm w-[350px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[480px]">
              <div className="p-md bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
                <span className="font-label-md text-label-md font-bold text-on-surface">Notifications</span>
                <span className="text-[10px] bg-primary text-on-primary px-sm py-0.5 rounded-full font-semibold">
                  {unreadNotifications.length} Unread
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-outline-variant">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-md transition-colors flex gap-sm items-start cursor-pointer hover:bg-surface-container-low ${!notif.is_read ? 'bg-primary-fixed/15 border-l-4 border-primary' : ''}`}
                      onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                    >
                      <div className="mt-0.5">
                        <span className={`material-symbols-outlined text-[20px] ${notif.notification_type === 'Compliance Alert' ? 'text-error' : 'text-surface-tint'}`}>
                          {notif.notification_type === 'Compliance Alert' ? 'warning' : 'build'}
                        </span>
                      </div>
                      <div className="flex-1 space-y-xs min-w-0">
                        <div className="flex justify-between items-center">
                          <p className={`text-xs font-bold truncate text-on-surface ${!notif.is_read ? 'font-black' : ''}`}>
                            {notif.title}
                          </p>
                          <span className="text-[9px] text-on-surface-variant flex-shrink-0">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-snug line-clamp-3">
                          {notif.message}
                        </p>
                        {notif.vehicle_number && (
                          <span className="inline-block text-[9px] bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded font-mono">
                            Vehicle: {notif.vehicle_number}
                          </span>
                        )}
                        {!notif.is_read && (
                          <button 
                            className="text-[10px] text-primary font-semibold hover:underline block mt-xs"
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
                  ))
                ) : (
                  <div className="p-xl text-center text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[32px] text-outline-variant mb-xs">notifications_off</span>
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button className="p-sm text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors cursor-pointer active:opacity-80 hidden md:block">
          <span className="material-symbols-outlined">settings</span>
        </button>
        
        {/* User Card */}
        {user && (
          <div className="ml-sm pl-sm border-l border-outline-variant flex items-center gap-sm cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant group-hover:border-primary transition-colors">
              <img
                alt={user.full_name}
                className="w-full h-full object-cover"
                src={user.profile_picture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyNWRLx_E1OWgPi7aT-s7keymJamS_sAULSOKC77sBamBVVEH8asmCa3f4NYOaE3mG3geTNRGrCEk9EHHGtRbopLaZ52J0biD4pjdRExkF4tELoYtoq-zasE6so0CeaGSIAvvheeL2qrq5EGlYXYnXy2LFAAHWpIX7MRS7rUU0FgN3ulrekGF7ncrztv17tLcE_3HUrNuSMCnC1wGiBZ6Az6Q7ajamDg6nZkmfN3G0rW9Vloo_heFU'}
              />
            </div>
            <div className="hidden lg:block">
              <p className="font-label-md text-label-md text-on-surface">
                {user.full_name}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant capitalize">
                {user.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
