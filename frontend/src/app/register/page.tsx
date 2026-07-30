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

      // Navigate safely to dashboard upon successful registration
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            Streamline your fleet and service operations.
          </h2>
          <p className="font-body-lg text-body-lg text-on-primary-container leading-relaxed">
            Register your organizational profile to track vehicle compliance, manage service center records, and calculate predictive maintenance risks in real-time.
          </p>
        </div>

        {/* Footer info */}
        <div className="z-10 border-t border-white/10 pt-md flex items-center justify-between text-body-sm text-on-primary-container">
          <span>&copy; {new Date().getFullYear()} FleetGuard Logistics</span>
          <div className="flex gap-md">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Registration Form Panel (Right) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-md md:p-xl bg-surface-container-lowest">
        <div className="w-full max-w-[500px] space-y-lg">
          {/* Header */}
          <div className="space-y-xs">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Create Your Account
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign In
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              {/* Full Name */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-xs">
                Email Address *
              </label>
              <input
                required
                type="email"
                placeholder="john@enterprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-xs">
                Password *
              </label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              {/* Role Select */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs">
                  Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none cursor-pointer"
                >
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Admin">Administrator</option>
                  <option value="Service Center">Service Center (Mechanic)</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none"
                />
              </div>
            </div>

            {/* Profile Picture URL */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-xs">
                Profile Picture URL
              </label>
              <input
                type="text"
                placeholder="https://example.com/avatar.jpg"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                className="w-full bg-surface-container rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none"
              />
            </div>

            {/* Terms and Conditions checkbox */}
            <div className="flex items-start gap-sm pt-xs">
              <input
                id="terms"
                required
                type="checkbox"
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer mt-0.5"
              />
              <label htmlFor="terms" className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer select-none">
                I agree to the Terms of Service and Privacy Policy.
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
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  <span>Register Account</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}