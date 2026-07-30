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
  <header className="flex justify-between items-center px-6 py-3 w-full z-45 bg-white/90 border-b border-slate-200 sticky top-0 flex-shrink-0 backdrop-blur-md shadow-xs">
    {/* Mobile Toggle & Brand */}
    <div className="flex items-center gap-3 md:hidden">
      <button
        className="p-2 text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
        onClick={onMenuClick}
      >
        <span className="material-symbols-outlined text-[22px]">menu</span>
      </button>
      <span className="text-xl font-extrabold text-blue-600 tracking-tight">
        FleetGuard
      </span>
    </div>

    {/* Search Bar (Desktop) */}
    <div className="hidden md:flex items-center flex-1 max-w-md bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
      <span className="material-symbols-outlined text-slate-400 mr-2.5 text-[20px]">
        search
      </span>
      <input
        className="bg-transparent border-none focus:ring-0 w-full text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
        placeholder={searchPlaceholder}
        type="text"
        value={searchValue}
        onChange={(e) => onSearchChange?.(e.target.value)}
      />
    </div>

    {/* Utility Actions & User Info */}
    <div className="flex items-center gap-2 ml-auto relative">
      {/* Notifications Bell Dropdown */}
      <div ref={dropdownRef} className="relative">
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer active:scale-95 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadNotifications.length > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-rose-500 text-white text-[10px] font-extrabold rounded-full border-2 border-white flex items-center justify-center px-1 animate-pulse">
              {unreadNotifications.length}
            </span>
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-[360px] bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[480px]">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Notifications</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                {unreadNotifications.length} Unread
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-3.5 transition-colors flex gap-3 items-start cursor-pointer hover:bg-slate-50/80 ${
                      !notif.is_read ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : ''
                    }`}
                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        notif.notification_type === 'Compliance Alert' 
                          ? 'bg-rose-50 text-rose-600' 
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">
                          {notif.notification_type === 'Compliance Alert' ? 'warning' : 'build'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-xs truncate text-slate-900 ${!notif.is_read ? 'font-extrabold' : 'font-semibold'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-medium">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        {notif.vehicle_number && (
                          <span className="inline-block text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold">
                            {notif.vehicle_number}
                          </span>
                        )}
                        {!notif.is_read && (
                          <button 
                            className="text-[10px] text-blue-600 font-bold hover:underline ml-auto"
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
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 font-medium">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 mb-2 block">
                    notifications_off
                  </span>
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </div>
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
    </div>
  </header>
);
}