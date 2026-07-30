'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
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
      <div className="flex min-h-screen w-screen items-center justify-center bg-[#0d131a]">
        <div className="w-8 h-8 border-2 border-[#ff2a2a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0e17] font-sans selection:bg-[#ff2a2a] selection:text-white">

      {/* === CSS-only Animated Background === */}

      {/* Base radial gradient foundation */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 15% 40%, rgba(220,38,38,0.13) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 75%, rgba(30,58,138,0.16) 0%, transparent 60%),
            radial-gradient(ellipse 100% 80% at 50% 0%, rgba(15,23,42,0.95) 0%, #0a0e17 80%)
          `,
        }}
      />

      {/* Animated red glowing orb — top-left */}
      <div
        className="absolute rounded-full blur-3xl opacity-25 animate-pulse"
        style={{
          width: '500px',
          height: '500px',
          top: '-120px',
          left: '-80px',
          background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, rgba(185,28,28,0.2) 50%, transparent 70%)',
          animationDuration: '4s',
        }}
      />

      {/* Animated blue orb — bottom-right */}
      <div
        className="absolute rounded-full blur-3xl opacity-20 animate-pulse"
        style={{
          width: '580px',
          height: '580px',
          bottom: '-140px',
          right: '-140px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(29,78,216,0.15) 50%, transparent 70%)',
          animationDuration: '6s',
          animationDelay: '2s',
        }}
      />

      {/* Dot-matrix grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%)' }}
      />

      {/* Soft arc overlay — left edge */}
      <div className="pointer-events-none absolute -left-20 top-0 h-full w-1/2 rounded-r-full bg-white/[0.025] border-r border-white/5 backdrop-blur-[2px]" />

      {/* Top Navigation Bar */}
      <nav className="relative z-20 flex items-center justify-between px-8 md:px-16 py-6">
        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-10 text-white/80 text-sm font-semibold tracking-wide">
          <a href="#" className="hover:text-white transition-colors">Home</a>
          <a href="#" className="hover:text-white transition-colors">About Us</a>
          <a href="#" className="hover:text-white transition-colors">Listings</a>
          <a href="#" className="hover:text-white transition-colors">Services</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>

        {/* Right Auth Section */}
        <div className="flex items-center gap-6 ml-auto">
          <Link
            href="/register"
            className="text-white/80 hover:text-white text-sm font-bold tracking-wide transition-colors"
          >
            Sign Up
          </Link>

          {/* Red Pill Log In Badge */}
          <div className="flex items-center bg-[#ff2a2a] text-white text-sm font-black tracking-wider pl-2 pr-6 py-1.5 rounded-full shadow-lg shadow-[#ff2a2a]/30">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 text-[#ff2a2a]">
              <span className="material-symbols-outlined text-lg">person</span>
            </div>
            <span>Log In</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center px-8 md:px-16 pb-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Column: Typography & Badges */}
          <div className={`lg:col-span-7 space-y-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* Red Welcome Ribbon (Sharp Edge Right) */}
            <div className="inline-block bg-[#ff2a2a] text-white text-xs font-black tracking-[0.25em] px-6 py-2 uppercase shadow-md clip-path-ribbon">
              WELCOME
            </div>

            {/* Bold Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.02] tracking-tight">
              Enjoy Your<br />
              Journey with<br />
              Our <span className="text-[#ff2a2a]">Comfortable car.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-md">
              Real-time vehicle compliance, predictive maintenance, and enterprise-grade fleet analytics — all in one platform.
            </p>

            {/* Pagination / Dots indicator */}
            <div className="flex items-center gap-2 pt-2">
              <span className="w-3 h-3 rounded-full bg-white" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
            </div>

            {/* Decorative Dot Matrix Grid */}
            <div className="pt-6">
              <div className="grid grid-cols-8 gap-2.5 w-fit opacity-40">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
                ))}
              </div>
            </div>
          </div>

          {/* Center Decorative Arrows */}
          <div className="hidden xl:flex lg:col-span-1 justify-center items-center opacity-60 text-white font-black text-3xl tracking-tighter select-none">
            &#171;&#171;&#171;
          </div>

          {/* Right Column: Clean White-Form UI */}
          <div className={`lg:col-span-5 xl:col-span-4 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* Form Container */}
            <div className="space-y-3">

              {/* Error Message Display */}
              {error && (
                <div className="p-3 rounded-md bg-[#ff2a2a]/20 border border-[#ff2a2a] text-white text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Email Input Field */}
                <div >
                  <input
                    required
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white text-gray-800 placeholder:text-gray-400 font-semibold italic px-5 py-3.5 rounded-md text-sm outline-none shadow-md focus:ring-2 focus:ring-[#ff2a2a] transition-all"
                  />
                </div>

                {/* Password Input Field */}
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white text-gray-800 placeholder:text-gray-400 font-semibold italic px-5 py-3.5 rounded-md text-sm outline-none shadow-md focus:ring-2 focus:ring-[#ff2a2a] transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Demo Selection Buttons (Role Fill) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setEmail('admin@fleetguard.com'); setPassword('admin123'); }}
                    className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-white/70 text-xs font-mono transition-all text-center border border-white/10"
                  >
                    Demo: Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('manager@fleetguard.com'); setPassword('manager123'); }}
                    className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-white/70 text-xs font-mono transition-all text-center border border-white/10"
                  >
                    Demo: Manager
                  </button>
                </div>

                {/* Primary Split Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#ff2a2a] hover:bg-[#e02222] text-white font-black rounded-md overflow-hidden flex items-center justify-between shadow-lg shadow-[#ff2a2a]/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="px-6 py-4 uppercase tracking-wider text-sm flex-1 text-center">
                    {loading ? 'Authenticating...' : 'Sign In Now'}
                  </span>
                  <div className="bg-black/20 px-4 py-4 flex items-center justify-center border-l border-white/10">
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </div>
                </button>
              </form>

              {/* Footer Copyright */}
              <p className="text-center text-white/30 text-xs pt-4">
                © {new Date().getFullYear()} FleetGuard Logistics Enterprise
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}