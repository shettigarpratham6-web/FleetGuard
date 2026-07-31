'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { CheckCircle2, ShieldCheck, Truck, Zap } from 'lucide-react';

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

      router.push('/home');
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
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-blue-600 text-white font-extrabold text-sm px-2.5 py-1 rounded-md shadow-sm">
            SF
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Simply<span className="text-blue-600">Fleet</span>
          </span>
        </Link>
      </nav>

      {/* Main Container - Centered Two-Column Layout */}
      <main className="flex-1 w-full flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">

        {/* Outer Grid Container */}
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* LEFT SIDE CARD: Feature Highlight Showcase */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-8 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">

            {/* Subtle Gradient Glow Backgrounds */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                <Zap size={14} /> AI-Powered Fleet Management
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Streamline Your Fleet Operations
                </h2>
                <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                  Join thousands of fleet managers, drivers, and service centers keeping vehicles compliant and maintenance on schedule.
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-blue-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Automated Maintenance Alerts</h4>
                    <p className="text-xs text-slate-400">Stay ahead of service intervals before costly breakdowns occur.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Digital Inspections & DVIR</h4>
                    <p className="text-xs text-slate-400">Drivers capture mobile logs with photo proof and defect reporting.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Truck className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Real-Time Fleet Analytics</h4>
                    <p className="text-xs text-slate-400">Track operating costs, fuel consumption, and asset health effortlessly.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Testimonial / Quote */}
            <div className="relative z-10 pt-8 border-t border-slate-800/80 mt-8">
              <p className="text-xs italic text-slate-300">
                "Simply Fleet cut our maintenance downtime by over 30% within the first two months."
              </p>
              <span className="block mt-2 text-[11px] font-semibold text-slate-400">
                — Fleet Operations Team
              </span>
            </div>
          </div>

          {/* RIGHT SIDE CARD: Registration Form */}
          <div className="lg:col-span-7 bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 flex flex-col justify-center space-y-5">

            {/* Form Title & Subtitle */}
            <div className="space-y-1">
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

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/60 bg-white py-3 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Simply Fleet. All rights reserved.
      </footer>
    </div>
  );
}