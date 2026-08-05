'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import GoogleButton from '@/components/GoogleButton';

interface AuthCardLayoutProps {
  roleTitle: string;
  roleSubtitle: string;
  defaultEmail: string;
  defaultPass: string;
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  onSubmit: (email: string, pass: string) => Promise<void>;
  loading: boolean;
  error: string;
  backLinkUrl?: string;
  backLinkLabel?: string;
}

export default function AuthCardLayout({
  roleTitle,
  roleSubtitle,
  defaultEmail,
  defaultPass,
  heroTitle,
  heroSubtitle,
  heroTagline,
  onSubmit,
  loading,
  error,
  backLinkUrl = '/login',
  backLinkLabel = "Don't have an account? Create an account",
}: AuthCardLayoutProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState(defaultPass);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const roleCards = [
    {
      role: 'Admin',
      label: 'Admin',
      email: 'admin@fleetguard.com',
      pass: 'admin123',
      iconName: 'admin_panel_settings',
      iconColor: 'text-blue-600 bg-blue-50',
      description: 'System Governance'
    },
    {
      role: 'Fleet Manager',
      label: 'Fleet Manager',
      email: 'manager@fleetguard.com',
      pass: 'manager123',
      iconName: 'analytics',
      iconColor: 'text-amber-600 bg-amber-50',
      description: 'Fleet Analytics'
    },
    {
      role: 'Driver',
      label: 'Driver',
      email: 'driver@fleetguard.com',
      pass: 'driver123',
      iconName: 'local_shipping',
      iconColor: 'text-emerald-600 bg-emerald-50',
      description: 'Vehicle Assignments'
    },
    {
      role: 'Service Center',
      label: 'Service Center',
      email: 'mechanic@fleetguard.com',
      pass: 'mechanic123',
      iconName: 'build',
      iconColor: 'text-purple-600 bg-purple-50',
      description: 'Service Queue'
    }
  ];

  const slides = [
    {
      title: heroTitle || "Connect with every vehicle.",
      subtitle: heroSubtitle || "Everything you need in an easily customizable dashboard.",
      tagline: heroTagline || "REAL-TIME FLEET OPERATIONS CENTER"
    },
    {
      title: "Predictive Maintenance & Expiry Alerts",
      subtitle: "Automated risk clocks, age compliance checks, and single-action resets.",
      tagline: "AUTOMATED SAFETY & COMPLIANCE"
    },
    {
      title: "Smart Driver & Operational Insights",
      subtitle: "Real-time duty assignments, compliance tracking, and fleet visibility.",
      tagline: "OPTIMIZED FLEET EFFICIENCY"
    }
  ];

  // Auto-slide every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1B63F4] to-blue-500 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            FG
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            FleetGuard
          </span>
        </Link>

        <div className="text-xs font-semibold text-slate-500">
          Need help?{' '}
          <a
            href="mailto:support@fleetguard.com"
            className="text-blue-600 font-bold hover:underline"
          >
            Support
          </a>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-blue-900/5 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
          
          {/* Left Column: Form */}
          <div className="w-full p-8 md:p-10 flex flex-col justify-between min-w-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Log in to your Account
              </h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {roleSubtitle || 'Select role portal below or enter details to log in:'}
              </p>

              {/* 2X2 Role Card Selection Box */}
              <div className="grid grid-cols-2 gap-3 mt-4 mb-2">
                {roleCards.map((card) => {
                  const isSelected = email === card.email;
                  return (
                    <button
                      key={card.role}
                      type="button"
                      onClick={() => {
                        setEmail(card.email);
                        setPassword(card.pass);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                        isSelected
                          ? 'border-2 border-blue-600 bg-blue-50/70 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconColor}`}>
                          <span className="material-symbols-outlined text-[18px]">{card.iconName}</span>
                        </div>
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300"></span>
                        )}
                      </div>
                      <div className="mt-2.5">
                        <div className="text-xs font-extrabold text-slate-900">{card.label}</div>
                        <div className="text-[10px] font-medium text-slate-500 mt-0.5">{card.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  or continue with email
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-3.5">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl animate-shake">
                    {error}
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </div>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                    </div>
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-10 pr-12 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    Remember me
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Password reset instructions have been sent to your registered email.');
                    }}
                    className="font-bold text-blue-600 hover:underline text-[11px]"
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Primary Log In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1B63F4] hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold rounded-xl text-xs tracking-wide transition-all shadow-lg shadow-blue-500/25 active:scale-[0.99] cursor-pointer mt-1"
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </button>

                {/* Continue with Google */}
                <GoogleButton
                  className="w-full py-2.5 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
                  redirectTo="/dashboard"
                />
              </form>
            </div>

            {/* Back link / register footer */}
            <div className="mt-6 text-center text-xs font-semibold text-slate-400">
              <Link href={backLinkUrl} className="text-blue-600 hover:underline">
                {backLinkLabel}
              </Link>
            </div>
          </div>

          {/* Right Column: Vibrant Blue Banner & Rich Graphic */}
          <div className="w-full bg-gradient-to-br from-[#1B63F4] via-[#2563EB] to-[#1D4ED8] p-8 lg:p-10 text-white flex flex-col justify-between text-center relative overflow-hidden min-w-0">
            {/* Background Glow Elements */}
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full border border-white/10 pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full border border-white/10 pointer-events-none"></div>

            {/* App Mockup Graphic */}
            <div className="relative z-10 my-auto flex justify-center py-2 w-full">
              <div className="w-full max-w-[320px] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl text-slate-900 border border-white/30 transform hover:-translate-y-1 transition-transform mx-auto">
                {/* macOS dots & Live Indicator */}
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-600 flex items-center gap-1 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Live Operations
                  </span>
                </div>

                {/* Rich Fleet Activity Cards */}
                <div className="space-y-2 text-left">
                  <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                      </div>
                      <div>
                        <div className="text-[11px] font-extrabold text-slate-900">Heavy Truck #TR-402</div>
                        <div className="text-[9px] font-semibold text-slate-400">Route #40 - Active</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Compliant</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                      </div>
                      <div>
                        <div className="text-[11px] font-extrabold text-slate-900">Delivery Van #VN-108</div>
                        <div className="text-[9px] font-semibold text-slate-400">PUC Renewal Pending</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">3 Days</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <span className="material-symbols-outlined text-[16px]">build</span>
                      </div>
                      <div>
                        <div className="text-[11px] font-extrabold text-slate-900">Express EV #EC-55</div>
                        <div className="text-[9px] font-semibold text-slate-400">Scheduled Service</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">In Shop</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Text Content with Block Width */}
            <div className="relative z-10 w-full text-center mt-6 px-4 pb-2">
              <div key={activeSlide} className="w-full block animate-fade-in">
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-snug w-full block text-center mb-2 font-sans">
                  {slides[activeSlide].title}
                </h2>
                <p className="text-xs md:text-sm text-blue-100 font-medium text-center leading-relaxed w-full block max-w-[420px] mx-auto mb-3 font-sans">
                  {slides[activeSlide].subtitle}
                </p>
              </div>

              {/* Interactive 3 Dots Indicator */}
              <div className="flex items-center justify-center gap-2 my-3 w-full">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`transition-all duration-300 cursor-pointer ${
                      activeSlide === idx
                        ? 'w-6 h-2 bg-white rounded-full shadow-md'
                        : 'w-2 h-2 bg-white/40 hover:bg-white/70 rounded-full'
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
              
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200 text-center w-full block pt-1 font-sans">
                {slides[activeSlide].tagline}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs font-semibold text-slate-400">
        © 2026 FleetGuard Enterprise. All rights reserved.
      </footer>
    </div>
  );
}
