'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ArrowLeft,
  CheckCircle2,
  UserCheck,
  Key,
  RefreshCw,
  Edit3,
  Camera,
  Bell
} from 'lucide-react';
import { api } from '@/services/api';
import { User as UserType } from '@/types';
// Import your existing wrapper or standalone Navbar/Sidebar components
import LayoutWrapper from '@/components/LayoutWrapper';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'preferences'>('general');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const localUser = api.auth.getLocalUser();
        if (localUser) {
          setUser(localUser);
        }
        if (api.auth.isAuthenticated()) {
          const freshUser = await api.auth.getCurrentUser();
          setUser(freshUser);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <RefreshCw className="animate-spin h-5 w-5 text-blue-600" />
            Loading profile details...
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition border border-slate-200 bg-white shadow-xs cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Profile</h1>
              <p className="text-xs font-medium text-slate-500">
                Manage your credentials, preferences, and personal details.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Banner Card */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 relative">
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          </div>

          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 shadow-md overflow-hidden ring-4 ring-blue-500/10">
                    <img
                      src={
                        user?.profile_picture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user?.full_name || 'User'
                        )}&background=091426&color=fff&size=128`
                      }
                      alt={user?.full_name || 'User Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user?.full_name || 'User'
                        )}&background=091426&color=fff&size=128`;
                      }}
                    />
                  </div>
                  <button
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full border-2 border-white hover:bg-blue-700 transition"
                    title="Update Avatar"
                  >
                    <Camera size={14} />
                  </button>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                    {user?.full_name || 'Fleet Member'}
                    <CheckCircle2 size={18} className="text-blue-600 fill-blue-50" />
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    {user?.email || 'user@fleetguard.com'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 capitalize border border-blue-200/60">
                      {user?.role || 'Driver'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {user?.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex items-center justify-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
                <div className="px-4 py-1 text-center border-r border-slate-200">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Security</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-center mt-0.5">
                    <Shield size={13} /> High
                  </span>
                </div>
                <div className="px-4 py-1 text-center">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Auth</span>
                  <span className="text-xs font-bold text-slate-700 mt-0.5 block">
                    {user?.firebase_uid ? 'SSO' : 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-6 text-xs font-medium">
              <button
                onClick={() => setActiveTab('general')}
                className={`pb-3 flex items-center gap-2 transition border-b-2 cursor-pointer ${activeTab === 'general'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                <UserIcon size={15} /> General Details
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`pb-3 flex items-center gap-2 transition border-b-2 cursor-pointer ${activeTab === 'security'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                <Shield size={15} /> Security & Auth
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`pb-3 flex items-center gap-2 transition border-b-2 cursor-pointer ${activeTab === 'preferences'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                <Bell size={15} /> Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Contents */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <UserIcon size={16} className="text-blue-600" /> Personal Information
              </h3>
              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Full Name</span>
                  <span className="font-bold text-slate-900">{user?.full_name || '-'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <span className="font-bold text-slate-900">{user?.email || '-'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Phone Number</span>
                  <span className="font-bold text-slate-900">{user?.phone_number || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Username</span>
                  <span className="font-bold text-slate-900">{user?.username || user?.email?.split('@')[0] || '-'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Shield size={16} className="text-blue-600" /> Account & Role Overview
              </h3>
              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Assigned Role</span>
                  <span className="font-bold text-slate-900 capitalize">{user?.role || 'Driver'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Branch</span>
                  <span className="font-bold text-slate-900">{user?.branch_id ? `Branch ID: ${user.branch_id}` : 'Headquarters / Main'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Account Created</span>
                  <span className="font-bold text-slate-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'March 2025'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Auth Method</span>
                  <span className="font-bold text-slate-900">{user?.firebase_uid ? 'Firebase / Google SSO' : 'Local Auth'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs text-xs space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">Security & Authentication Settings</h3>
            <p className="text-slate-500">Manage multi-factor authentication, active sessions, and password rules.</p>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs text-xs space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">User Preferences</h3>
            <p className="text-slate-500">Configure email notifications, dispatch alerts, and application themes.</p>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}