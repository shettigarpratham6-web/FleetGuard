'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Driver');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password) {
      setError('Please fill in all required fields (*).');
      return;
    }

    setLoading(true);

    try {
      await api.auth.register({
        full_name: fullName,
        username: username || undefined,
        email,
        password,
        role: role as any,
        phone_number: phoneNumber || undefined,
        profile_picture: profilePicture || undefined,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">

      {/* Header Bar */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 text-white font-extrabold text-sm px-2.5 py-1 rounded-md shadow-sm">
            SF
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Simply<span className="text-blue-600">Fleet</span>
          </span>
        </div>
      </nav>

      {/* Main Container - Centered */}
      <main className="flex-1 w-full flex items-center justify-center px-4 py-8">

        {/* Balanced Card */}
        <div className="w-full sm:w-[480px] bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-5">

          {/* Form Title & Subtitle */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Create an account
            </h1>
            <p className="text-xs text-slate-500">
              Register your profile to manage fleet operations
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email Address *
              </label>
              <input
                required
                type="email"
                placeholder="john@enterprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password *
              </label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Role & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 cursor-pointer"
                >
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Admin">Administrator</option>
                  <option value="Service Center">Service Center</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Profile Picture URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Profile Picture URL
              </label>
              <input
                type="text"
                placeholder="https://example.com/avatar.jpg"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="terms"
                required
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 font-medium cursor-pointer">
                I agree to the Terms of Service & Privacy Policy
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm disabled:opacity-50 cursor-pointer active:scale-[0.99] mt-2"
            >
              {loading ? 'Creating account...' : 'Register Account'}
            </button>
          </form>

          {/* Navigation Link to Login */}
          <div className="pt-2 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/60 bg-white py-3 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Simply Fleet. All rights reserved.
      </footer>
    </div>
  );
}