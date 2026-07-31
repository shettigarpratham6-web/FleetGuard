'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scan,
  Calendar,
  Mic,
  MessageSquare,
  Check,
  Star,
  Bot,
  User,
  BarChart3,
  Wrench,
  ShieldCheck,
  Truck
} from 'lucide-react';

export default function Home() {
  // 1. Initialize the router hook here
  const router = useRouter();

  // Cursor position state for interactive parallax animations
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const user = api.auth.getLocalUser();

    if (user?.role) {
      if (
        user.role === 'Admin' ||
        user.role === 'Fleet Manager' ||
        user.role === 'Manager'
      ) {
        router.replace('/dashboard');
      } else {
        router.replace('/driver');
      }
    } else {
      // Invalid auth state - clear and redirect to login
      api.auth.logout();
      router.replace('/login');
    }
  }, [router]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    // Calculate cursor movement offset relative to screen center
    const x = (clientX - window.innerWidth / 2) / 40;
    const y = (clientY - window.innerHeight / 2) / 40;
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full bg-slate-50 text-slate-700 font-sans overflow-x-hidden"
    >
      {/* ==========================================
          HEADER / NAVBAR
      ========================================== */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-blue-600 text-white font-bold text-xl flex items-center justify-center w-10 h-10 rounded-lg transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-md shadow-blue-500/20">
              SF
            </div>
            <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
              Simply <span className="text-blue-600">Fleet</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <span className="cursor-pointer hover:text-blue-600 transition-colors">Product ▾</span>
            <span className="cursor-pointer hover:text-blue-600 transition-colors">Customers ▾</span>
            <Link href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            <span className="cursor-pointer hover:text-blue-600 transition-colors">Resource ▾</span>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors px-3 py-2">
              Log In
            </Link>
            <Link href="/register" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              Sign Up
            </Link>
            <Link href="/register" className="hidden sm:inline-block border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-100 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-300">
              Book A Demo
            </Link>
          </div>
        </div>
      </header>

      {/* ==========================================
          SECTION 1: HERO SECTION (Guaranteed Render + Parallax)
      ========================================== */}
      <section className="pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Content */}
          <div
            style={{
              transform: `translate3d(${-mousePos.x * 0.4}px, ${-mousePos.y * 0.4}px, 0)`
            }}
            className="lg:col-span-7 flex flex-col gap-6 transition-transform duration-100 ease-out"
          >
            <div>
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full inline-block shadow-sm">
                AI First Fleet Software for Fleets of All Sizes
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Complete Fleet Maintenance and Management
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              Manage vehicles, drivers, fuel, expenses, compliance, preventive maintenance,
              inspections and work orders in one connected system. Simply Fleet uses AI to
              capture receipts and invoices, reduce manual entry and turn fleet data into
              answers your team can act on.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/register" className="bg-slate-900 hover:bg-blue-600 text-white font-semibold px-6 py-3.5 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                Get Started
              </Link>
              <Link href="/register" className="border border-slate-300 hover:border-slate-400 text-slate-900 hover:bg-slate-100 font-semibold px-6 py-3.5 rounded-lg transition-all duration-300">
                Book Demo
              </Link>
            </div>
            <span className="text-xs text-slate-500 font-medium">No credit card required</span>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-[430px]">

              {/* Main Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5">

                <div className="rounded-2xl bg-slate-900 h-[520px] overflow-hidden relative">

                  {/* Glow Effects */}
                  <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl"></div>
                  <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"></div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>

                    <span className="text-xs text-slate-400 font-semibold">
                      Fleet Dashboard
                    </span>
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-slate-800 p-4">
                        <p className="text-slate-400 text-xs uppercase">
                          Active Fleet
                        </p>
                        <h2 className="text-3xl font-black text-white mt-2">
                          142
                        </h2>
                        <p className="text-emerald-400 text-xs mt-1">
                          ↑ 98.4% Operational
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-800 p-4">
                        <p className="text-slate-400 text-xs uppercase">
                          PM Compliance
                        </p>
                        <h2 className="text-3xl font-black text-blue-400 mt-2">
                          96.8%
                        </h2>
                        <p className="text-blue-300 text-xs mt-1">
                          On Schedule
                        </p>
                      </div>
                    </div>

                    {/* Maintenance Graph */}
                    <div className="rounded-xl bg-slate-800 p-4">
                      <p className="text-slate-400 text-xs mb-4">
                        Monthly Maintenance
                      </p>

                      <div className="flex items-end gap-2 h-32">
                        <div className="bg-blue-500 rounded w-5 h-12"></div>
                        <div className="bg-blue-500 rounded w-5 h-20"></div>
                        <div className="bg-blue-500 rounded w-5 h-16"></div>
                        <div className="bg-blue-500 rounded w-5 h-24"></div>
                        <div className="bg-blue-500 rounded w-5 h-14"></div>
                        <div className="bg-blue-500 rounded w-5 h-28"></div>
                        <div className="bg-blue-500 rounded w-5 h-20"></div>
                      </div>
                    </div>

                    {/* Vehicles */}
                    <div className="space-y-3">
                      <div className="rounded-lg bg-slate-800 p-3 flex justify-between">
                        <span className="text-white">
                          Truck KH01VS8
                        </span>
                        <span className="text-emerald-400">
                          Healthy
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-800 p-3 flex justify-between">
                        <span className="text-white">
                          Truck MH14TR2
                        </span>
                        <span className="text-yellow-400">
                          Service Due
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-800 p-3 flex justify-between">
                        <span className="text-white">
                          Truck KA19FG9
                        </span>
                        <span className="text-red-400">
                          Inspection
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between mt-5">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className="fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  <span className="text-sm font-medium text-slate-500">
                    Capterra
                  </span>

                  <span className="text-sm font-medium text-slate-500">
                    Google Play
                  </span>

                  <span className="text-sm font-medium text-slate-500">
                    App Store
                  </span>
                </div>
              </div>

              {/* Floating Card 1 */}
              <div className="absolute -left-14 top-20 bg-white rounded-xl shadow-xl border p-4 w-60">
                <p className="text-sm font-semibold text-slate-800">
                  🚛 Maintenance Reminder
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Oil & Filter service due for KH01VS8
                </p>
              </div>

              {/* Floating Card 2 */}
              <div className="absolute -right-14 bottom-20 bg-white rounded-xl shadow-xl border p-4 w-60">
                <p className="text-sm font-semibold text-red-600">
                  ⚠ Inspection Alert
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Rear tyre pressure below threshold.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 2: MOBILE FLEET WORKFLOWS
      ========================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">
              One Source of Truth
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Mobile Fleet Workflows For Drivers, Technicians And Managers
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Give each role a focused workflow while keeping every inspection, receipt, work order and update connected to the same fleet record.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Drivers Card */}
            <div
              style={{ transform: `translate3d(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px, 0)` }}
              className="bg-slate-50 rounded-2xl p-8 border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:bg-white hover:border-blue-300 group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Truck size={20} />
                </div>
                <span className="text-xs font-bold tracking-wider text-blue-600 uppercase">DRIVERS</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-6">
                Inspections, Defects, Fuel and Mileage
              </h3>

              <ul className="flex flex-col gap-4 text-sm font-medium text-slate-600">
                {[
                  'Complete mobile inspections',
                  'Report defects with photos',
                  'Scan fuel receipts',
                  'Log mileage or issues by voice'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Technicians Card */}
            <div
              style={{ transform: `translate3d(${-mousePos.x * 0.2}px, ${mousePos.y * 0.2}px, 0)` }}
              className="bg-slate-50 rounded-2xl p-8 border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:bg-white hover:border-blue-300 group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Wrench size={20} />
                </div>
                <span className="text-xs font-bold tracking-wider text-blue-600 uppercase">TECHNICIANS</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-6">
                Work Orders, Parts and Labor
              </h3>

              <ul className="flex flex-col gap-4 text-sm font-medium text-slate-600">
                {[
                  'View assigned work orders',
                  'Record parts and labor',
                  'Add notes and repair evidence',
                  'Update job status from mobile'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Fleet Managers Card */}
            <div
              style={{ transform: `translate3d(${mousePos.x * 0.2}px, ${-mousePos.y * 0.2}px, 0)` }}
              className="bg-slate-50 rounded-2xl p-8 border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:bg-white hover:border-blue-300 group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-xs font-bold tracking-wider text-blue-600 uppercase">FLEET MANAGERS</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-6">
                Costs, Compliance and Performance
              </h3>

              <ul className="flex flex-col gap-4 text-sm font-medium text-slate-600">
                {[
                  'Monitor overdue maintenance',
                  'Track work orders and downtime',
                  'Compare vehicle operating costs',
                  'Ask AI for instant fleet insights'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 3: AI FLEET MANAGEMENT
      ========================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-100/80 border-t border-slate-200 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-100/70 border border-blue-200 px-3.5 py-1.5 rounded-full">
                • The Simply Fleet Difference
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              AI Fleet Management Software That Reduces Manual Data Entry
            </h2>
            <p className="text-slate-600 text-lg">
              Scan receipts and invoices, log updates by voice, build preventive maintenance schedules and ask questions about your fleet data in plain English.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-300 group relative">
                <span className="absolute top-6 right-6 text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">01</span>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                  <Scan size={22} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Scan receipts and invoices</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Capture vendor, date, amount, parts and labor without manually retyping each line item.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-amber-300 group relative">
                <span className="absolute top-6 right-6 text-xs font-bold text-slate-400 group-hover:text-amber-600 transition-colors">02</span>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white">
                  <Calendar size={22} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Build PM schedules</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Generate maintenance recommendations based on vehicle profile, then adjust intervals.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-emerald-300 group relative">
                <span className="absolute top-6 right-6 text-xs font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">03</span>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white">
                  <Mic size={22} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Log updates by voice</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Drivers and technicians speak naturally while AI structures the entries automatically.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-purple-300 group relative">
                <span className="absolute top-6 right-6 text-xs font-bold text-slate-400 group-hover:text-purple-600 transition-colors">04</span>
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white">
                  <MessageSquare size={22} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Ask with Simply Ask</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Find overdue maintenance, high-cost vehicles, and fuel trends using plain English queries.</p>
              </div>
            </div>

            {/* AI Reporting Visual */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg flex flex-col">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                  Simply Ask in action
                </div>
                <span className="text-xs text-slate-500">Based on live fleet data</span>
              </div>

              <div className="p-6 flex flex-col gap-5 bg-slate-50/50 flex-1">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <BarChart3 size={18} className="text-blue-600" /> Reporting
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-md font-semibold">⚡ AI Powered</span>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 text-xs text-slate-700 shadow-sm">
                    Welcome to AI-powered reporting. Describe the report you need and I'll create it for you.
                  </div>
                </div>

                <div className="flex gap-3 justify-end items-start">
                  <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tr-none text-xs shadow-md">
                    Show my top 2 most expensive vehicles to maintain.
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User size={16} />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mt-1">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Vehicle Name</th>
                        <th className="p-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-semibold text-slate-800">Mack Granite Dump Truck</td>
                        <td className="p-3 text-right font-bold text-slate-900">$7,599.00</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-semibold text-slate-800">Freightliner Cascadia</td>
                        <td className="p-3 text-right font-bold text-slate-900">$6,240.50</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}