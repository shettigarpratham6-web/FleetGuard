'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import GoogleButton from "@/components/GoogleButton";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Helper function to handle role-based navigation
  const redirectBasedOnRole = useCallback((role?: string) => {
    if (!role) {
      router.replace('/login');
      return;
    }

    if (
      role === 'Admin' ||
      role === 'Fleet Manager' ||
      role === 'Manager'
    ) {
      router.replace('/dashboard');
    } else {
      router.replace('/driver');   // or your driver page
    }
  }, [router]);

  useEffect(() => {
    // If already authenticated, redirect immediately based on stored user role
    if (api.auth.isAuthenticated()) {
      const user = api.auth.getLocalUser();
      if (user?.role) {
        // Valid user data - proceed with role-based redirect
        redirectBasedOnRole(user.role);
      } else {
        // Invalid auth state - clear and show login form
        api.auth.logout();
        setCheckingAuth(false);
      }
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

      // Always use the stored user
      const user = api.auth.getLocalUser();

      if (!user) {
        throw new Error("User information not found after login.");
      }

      redirectBasedOnRole(user.role);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Spinner fallback to prevent UI flash during authentication verification
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-surface-container-lowest">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen bg-background overflow-y-auto">
      {/* Visual Showcase Panel (Left - Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-xl text-on-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e293b,transparent)] opacity-60"></div>
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-primary-container rounded-full filter blur-3xl opacity-30"></div>

        {/* Top Header */}
        <div className="z-10 flex items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-xl border border-white/20">
            FG
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-black tracking-tight text-white">
              FleetGuard
            </h1>
            <p className="font-body-sm text-[12px] text-on-primary-container">
              LOGISTICS ENTERPRISE
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="z-10 max-w-md my-auto space-y-md">
          <span className="inline-block px-sm py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold border border-white/15">
            Enterprise Fleet Management
          </span>
          <h2 className="font-display-lg text-display-lg font-black tracking-tight text-white leading-tight">
            Advanced Fleet Operations & Maintenance
          </h2>
          <p className="font-body-lg text-body-lg text-on-primary-container leading-relaxed">
            Monitor real-time vehicle compliance, schedule repairs, check predictive risk analysis, and receive automatic alerts on service intervals.
          </p>
        </div>

        {/* Footer info */}
        <div className="z-10 border-t border-white/10 pt-md flex items-center justify-between text-body-sm text-on-surface-container">
          <span id="current-year">&copy; 2026 FleetGuard Logistics</span>
          <div className="flex gap-md">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Login Form Panel (Right) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-md md:p-xl bg-surface-container-lowest">
        <div className="w-full max-w-[420px] space-y-lg">
          {/* Header */}
          <div className="space-y-xs">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Welcome Back
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-md">
            {error && (
              <div className="p-md rounded-xl bg-error-container/10 border border-error-container/30 text-error text-body-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-xs">
                Email Address
              </label>
              <input
                required
                type="email"
                placeholder="admin@fleetguard.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-xs">
                <label className="block font-label-md text-label-md text-on-surface">
                  Password
                </label>
                <a href="#" className="text-xs text-primary hover:underline">
                  Forgot Password?
                </a>
              </div>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none"
              />
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center gap-sm pt-xs">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="remember" className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer select-none">
                Keep me signed in on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:opacity-90 active:opacity-80 text-on-primary font-semibold py-sm rounded-lg flex items-center justify-center gap-xs shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pt-2.5 pb-2.5 mt-md"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-md">
            <div className="flex-grow border-t border-outline-variant opacity-50"></div>
            <span className="px-md text-xs font-medium text-on-surface-variant uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-outline-variant opacity-50"></div>
          </div>

          {/* Google Sign-in */}
          <GoogleButton
            onSuccess={() => redirectBasedOnRole(api.auth.getLocalUser()?.role || 'Admin')}
            onError={(err: any) => setError(err?.message || 'Google sign in failed.')}
          />

          {/* Quick Credential Hint */}
          <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface-variant space-y-1">
            <p className="font-semibold">Demo Credentials:</p>
            <p>• Admin: <code className="bg-surface-container px-1 py-0.5 rounded font-mono">admin@fleetguard.com</code> / <code className="bg-surface-container px-1 py-0.5 rounded font-mono">admin123</code></p>
            <p>• Manager: <code className="bg-surface-container px-1 py-0.5 rounded font-mono">manager@fleetguard.com</code> / <code className="bg-surface-container px-1 py-0.5 rounded font-mono">manager123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}