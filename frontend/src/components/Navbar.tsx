'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { User as UserType, Notification } from '@/types';
import { User as UserIcon, Settings, LogOut, ShieldCheck } from 'lucide-react';

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
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutsideProfile(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideProfile);
    return () => document.removeEventListener('mousedown', handleClickOutsideProfile);
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

  const handleLogout = () => {
    setProfileOpen(false);
    api.auth.logout();
    router.push('/login');
  };

  const getNotifIcon = (type?: string) => {
    if (type === 'Compliance Alert') return { icon: 'warning', color: 'text-rose-500' };
    if (type === 'Maintenance Alert') return { icon: 'build', color: 'text-amber-500' };
    return { icon: 'notifications', color: 'text-blue-500' };
  };

  return (
    <header className="flex justify-between items-center px-6 py-3 w-full z-40 bg-white/90 border-b border-slate-200 sticky top-0 flex-shrink-0 backdrop-blur-md shadow-sm">
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors flex items-center justify-center"
          onClick={onMenuClick}
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <span className="text-xl font-extrabold text-blue-600 tracking-tight">
          FleetGuard
        </span>
      </div>

      {/* Search Bar (Desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-md bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition-all duration-200 shadow-sm ml-4 md:ml-0">
        <span className="material-symbols-outlined text-slate-400 mr-2 text-[18px]">
          search
        </span>
        <input
          className="bg-transparent border-none focus:ring-0 w-full text-sm text-slate-900 placeholder-slate-400 outline-none"
          placeholder={searchPlaceholder}
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        {searchValue && (
          <button
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
            onClick={() => onSearchChange?.('')}
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* Utility Actions & User Info */}
      <div className="flex items-center gap-2 ml-auto">

        {/* Notifications Bell Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-150 relative cursor-pointer active:scale-95 flex items-center justify-center focus-ring group"
            aria-label={`Notifications${unreadNotifications.length > 0 ? `, ${unreadNotifications.length} unread` : ''}`}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform" aria-hidden="true">
              notifications
            </span>
            {unreadNotifications.length > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center px-0.5"
                aria-hidden="true"
              >
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-[360px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[500px] animate-scale-in"
              role="dialog"
              aria-label="Notifications panel"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-700 fill" aria-hidden="true">notifications</span>
                  <span className="font-bold text-sm text-slate-900">Notifications</span>
                </div>
                {unreadNotifications.length > 0 && (
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                    {unreadNotifications.length} Unread
                  </span>
                )}
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => {
                    const { icon, color } = getNotifIcon(notif.notification_type);
                    return (
                      <div
                        key={notif.id}
                        className={`p-4 transition-all duration-150 flex gap-3 items-start cursor-pointer hover:bg-slate-50 ${!notif.is_read
                          ? 'bg-blue-50/50 border-l-[3px] border-blue-500'
                          : 'border-l-[3px] border-transparent'
                          }`}
                        style={{ animationDelay: `${idx * 30}ms` }}
                        onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                        role="article"
                        aria-label={notif.title}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${!notif.is_read ? 'bg-blue-100' : 'bg-slate-100'}`}>
                            <span className={`material-symbols-outlined text-[18px] ${color} ${!notif.is_read ? 'fill' : ''}`} aria-hidden="true">
                              {icon}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-[12px] font-semibold text-slate-900 leading-snug ${!notif.is_read ? 'font-bold text-blue-900' : ''}`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-slate-500 flex-shrink-0 mt-0.5 font-mono">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                            {notif.message}
                          </p>
                          {notif.vehicle_number && (
                            <span className="inline-block text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono mt-1 font-bold">
                              {notif.vehicle_number}
                            </span>
                          )}
                          {!notif.is_read && (
                            <button
                              className="text-[11px] text-blue-600 font-bold hover:underline block mt-1.5"
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
                    <span className="material-symbols-outlined text-[40px] text-slate-300 mb-2 block" aria-hidden="true">
                      notifications_off
                    </span>
                    <p className="text-sm text-slate-600 font-bold">All caught up!</p>
                    <p className="text-[11px] text-slate-500 mt-1">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => router.push('/profile')}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer active:scale-95 hidden md:block"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>

        {/* User Profile */}
        {user && (
          <div className="relative ml-2" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="pl-3 border-l border-slate-200 flex items-center gap-2.5 group cursor-pointer border-0 bg-transparent"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden ring-2 ring-slate-200 group-hover:ring-blue-600 transition">
                <img
                  src={
                    user.profile_picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.full_name
                    )}&background=091426&color=fff&size=64`
                  }
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.full_name
                    )}&background=091426&color=fff&size=64`;
                  }}
                />
              </div>

              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {user.full_name}
                </p>
                <p className="text-[10px] text-slate-500 capitalize">
                  {user.role}
                </p>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-blue-500/20 bg-slate-200 flex-shrink-0">
                      <img
                        src={
                          user.profile_picture ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.full_name
                          )}&background=091426&color=fff&size=128`
                        }
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.full_name
                          )}&background=091426&color=fff&size=128`;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {user.full_name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                      <span className="mt-1.5 inline-flex rounded-full bg-blue-100 text-blue-800 font-bold px-2 py-0.5 text-[10px] capitalize">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Username</span>
                    <span className="font-bold text-slate-800">{user.username || user.email.split('@')[0]}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Phone</span>
                    <span className="font-bold text-slate-800">{user.phone_number || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      {user.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 p-2 bg-slate-50/50 space-y-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/profile');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer border-0 bg-transparent"
                  >
                    <UserIcon size={16} />
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/profile');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer border-0 bg-transparent"
                  >
                    <Settings size={16} />
                    Account Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer border-0 bg-transparent"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}