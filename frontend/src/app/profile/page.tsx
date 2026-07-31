'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Calendar, Shield, ArrowLeft, CheckCircle2, UserCheck, Key, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import { User as UserType } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="animate-spin h-5 w-5 text-blue-600" />
          Loading profile details...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Back navigation & Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer border border-slate-200 bg-white shadow-xs"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Profile</h1>
              <p className="text-xs font-medium text-slate-500">View and manage your account information and preferences.</p>
            </div>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 flex justify-end items-start relative">
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
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

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                  {user?.full_name || 'Fleet Member'}
                  <CheckCircle2 size={18} className="text-blue-600 fill-blue-50" />
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  {user?.email || 'user@fleetguard.com'}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 capitalize">
                    {user?.role || 'Driver'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {user?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Personal Details */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              Personal Information
            </h3>

            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <User size={14} className="text-slate-400" /> Full Name
                </span>
                <span className="font-bold text-slate-900">{user?.full_name || '-'}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" /> Email Address
                </span>
                <span className="font-bold text-slate-900">{user?.email || '-'}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" /> Phone Number
                </span>
                <span className="font-bold text-slate-900">{user?.phone_number || 'Not provided'}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <UserCheck size={14} className="text-slate-400" /> Username
                </span>
                <span className="font-bold text-slate-900">{user?.username || user?.email?.split('@')[0] || '-'}</span>
              </div>
            </div>
          </div>

          {/* Organization & Account Info */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" />
              Account & Role Overview
            </h3>

            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Shield size={14} className="text-slate-400" /> Assigned Role
                </span>
                <span className="font-bold text-slate-900 capitalize">{user?.role || 'Driver'}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" /> Branch
                </span>
                <span className="font-bold text-slate-900">{user?.branch_id ? `Branch ID: ${user.branch_id}` : 'Headquarters / Main'}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" /> Account Created
                </span>
                <span className="font-bold text-slate-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'March 2025'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Key size={14} className="text-slate-400" /> Auth Method
                </span>
                <span className="font-bold text-slate-900">{user?.firebase_uid ? 'Firebase / Google SSO' : 'Local Auth'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}