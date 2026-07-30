'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const redirectBasedOnRole = useCallback(
    (role?: string) => {
      if (!role) {
        router.replace('/login');
        return;
      }
      if (role === 'Admin' || role === 'Fleet Manager' || role === 'Manager') {
        router.replace('/dashboard');
      } else {
        router.replace('/driver');
      }
    },
    [router]
  );

  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      const user = api.auth.getLocalUser();
      redirectBasedOnRole(user?.role);
    } else {
      setCheckingAuth(false);
    }
  }, [redirectBasedOnRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.login(email, password);
      const user = api.auth.getLocalUser();
      if (!user) throw new Error('User information not found after login.');
      redirectBasedOnRole(user.role);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">

      {/* ================= 1. SEPARATE TOP HEADER ================= */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 sm:px-12 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 text-white font-black text-xs px-2.5 py-1.5 rounded-xl shadow-md shadow-blue-500/20">
            SF
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            Simply<span className="text-blue-600">Fleet</span>
          </span>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Need help? <a href="#" className="text-blue-600 font-bold hover:underline">Support</a>
        </div>
      </header>

      {/* ================= 2. MAIN TWO CARDS SECTION ================= */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">

        {/* Grid Wrapper for Two Distinct Cards */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

          {/* ----- LEFT CARD: LOGIN FORM ----- */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">

            <div className="space-y-6 my-auto">
              {/* Form Title & Subtitle */}
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Log in to your Account
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Welcome back! Select method or enter details to log in:
                </p>
              </div>

              {/* Demo Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@fleetguard.com'); setPassword('admin123'); }}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Demo Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('manager@fleetguard.com'); setPassword('manager123'); }}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Demo Manager
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-slate-100 w-full"></div>
                <span className="bg-white px-3 text-[11px] text-slate-400 font-medium absolute">
                  or continue with email
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs text-center font-medium">
                  {error}
                </div>
              )}

              {/* Login Form Inputs */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email Input */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </span>
                  <input
                    required
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </span>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-10 py-3 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                  </button>
                </div>

                {/* Options */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    Remember me
                  </label>
                  <a href="#" className="text-blue-600 font-bold hover:underline">
                    Forgot Password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all text-sm disabled:opacity-50 cursor-pointer active:scale-[0.99] mt-2"
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
              </form>
            </div>

            {/* Bottom Register Link */}
            <div className="text-center text-xs text-slate-400 font-medium pt-4">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 font-bold hover:underline">
                Create an account
              </Link>
            </div>

          </div>


          {/* ----- RIGHT CARD: MATCHING SCREENSHOT DESIGN ----- */}
          <div className="hidden lg:flex bg-blue-600 rounded-3xl p-8 lg:p-10 flex-col justify-between items-center text-center text-white relative overflow-hidden shadow-xl shadow-blue-600/20 min-h-[560px]">

            {/* Background Soft Glow Circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-white/5 pointer-events-none" />

            {/* Spacer */}
            <div className="w-full h-2"></div>

            {/* Center Visual Component */}
            <div className="w-full max-w-md flex flex-col items-center justify-center z-10 my-auto">

              {/* Graphic Illustration Wrapper */}
              <div className="relative w-full h-56 flex items-center justify-center">

                {/* SVG Connecting Tree Lines */}
                <svg className="absolute inset-0 w-full h-full stroke-white/30 fill-none" viewBox="0 0 400 200">
                  <path
                    d="M 100 50 H 160 C 180 50, 180 100, 200 100 H 220"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 100 100 H 220"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 100 150 H 160 C 180 150, 180 100, 200 100 H 220"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Left Floating Vehicle Badges */}
                <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-between py-2 z-10">
                  {/* Vehicle Icon 1 (Car) */}
                  <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-xl text-slate-800 border-2 border-blue-200 hover:scale-105 transition-transform">
                    🚗
                  </div>
                  {/* Vehicle Icon 2 (Truck) */}
                  <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-xl text-slate-800 border-2 border-blue-200 hover:scale-105 transition-transform">
                    🚛
                  </div>
                  {/* Vehicle Icon 3 (Electric Van) */}
                  <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-xl text-slate-800 border-2 border-blue-200 hover:scale-105 transition-transform">
                    🚐
                  </div>
                </div>

                {/* Right Window UI Mockup */}
                <div className="absolute right-2 w-52 bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100 text-left z-10">
                  {/* Window Title Bar */}
                  <div className="bg-slate-100/80 px-3 py-2 flex items-center gap-1.5 border-b border-slate-200/60">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  </div>

                  {/* Window Content */}
                  <div className="p-3 space-y-2.5">
                    {/* Skeleton Tabs */}
                    <div className="flex gap-2 mb-2">
                      <div className="h-2 w-12 bg-slate-300 rounded-full"></div>
                      <div className="h-2 w-8 bg-slate-200 rounded-full"></div>
                    </div>

                    {/* Row 1 */}
                    <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-2 border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">📍</div>
                      <div className="flex-1 space-y-1">
                        <div className="h-2 w-20 bg-slate-400 rounded-full"></div>
                        <div className="h-1.5 w-12 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-2 border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">⚡</div>
                      <div className="flex-1 space-y-1">
                        <div className="h-2 w-16 bg-slate-400 rounded-full"></div>
                        <div className="h-1.5 w-10 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-2 border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px]">🛠️</div>
                      <div className="flex-1 space-y-1">
                        <div className="h-2 w-22 bg-slate-400 rounded-full"></div>
                        <div className="h-1.5 w-14 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Text Block matching the image typography */}
              <div className="space-y-2 mt-8 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Connect with every vehicle.  🚍
                </h2>
                <p className="text-xs text-blue-100/80 mx-auto leading-relaxed font-normal text-center">
                  <span className="block">Everything you need in an</span>
                  <span className="block">easily customizable dashboard.</span>
                </p>
              </div>

              {/* Carousel Indicators */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span className="w-2 h-2 rounded-full bg-white/40"></span>
                <span className="w-2 h-2 rounded-full bg-white/40"></span>
              </div>

            </div>

            {/* Bottom Footer Text */}
            <div className="z-10 text-[11px] text-blue-200/80 font-medium">
              Real-time Fleet Operations Center
            </div>

          </div>

        </div>

      </main>

      {/* ================= 3. FOOTER ================= */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 font-medium">
        © {new Date().getFullYear()} Simply Fleet Enterprise. All rights reserved.
      </footer>

    </div>
  );
}