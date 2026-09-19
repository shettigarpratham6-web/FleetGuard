'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';
import KPICards from '@/components/KPICards';
import { api } from '@/services/api';
import { Vehicle, MaintenanceRisk } from '@/types';

export default function HomePage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [risks, setRisks] = useState<MaintenanceRisk[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                setLoading(true);
                const [vehiclesData, risksData] = await Promise.all([
                    api.vehicles.getAll(),
                    api.risks.getAll(),
                ]);
                setVehicles(vehiclesData || []);
                setRisks(risksData || []);
            } catch (err) {
                console.error('Error fetching Home page KPI data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchKPIs();
    }, []);

    // Sample activity data for table
    const recentActivities = [
        {
            id: 1,
            vehicle: 'Freightliner Cascadia (VIN: 4V1NC9EJ6NN104829)',
            activity: 'Preventive Maintenance Completed',
            date: 'July 30, 2026',
            status: 'Completed',
            statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
            id: 2,
            vehicle: 'Ford Transit 350 (VIN: 1FTBR1Y84MKA92104)',
            activity: 'Annual Safety & Emissions Inspection',
            date: 'July 29, 2026',
            status: 'In Progress',
            statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        {
            id: 3,
            vehicle: 'Volvo VNL 860 (VIN: 4V4NC9EH8MN982312)',
            activity: 'Brake Pad Replacement & Rotor Polish',
            date: 'July 28, 2026',
            status: 'Scheduled',
            statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
        },
        {
            id: 4,
            vehicle: 'Isuzu NPR-HD (VIN: 4JAB1F152K7001928)',
            activity: 'Tire Pressure & Alignment Check',
            date: 'July 27, 2026',
            status: 'Completed',
            statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
            id: 5,
            vehicle: 'Kenworth T680 (VIN: 1XKAD49X9NJ284019)',
            activity: 'Transmission Fluid Flushing & Filter Replacement',
            date: 'July 26, 2026',
            status: 'Completed',
            statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
    ];

    return (
        <LayoutWrapper>
            <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900 font-sans antialiased">

                {/* TOP HERO SECTION */}
                <div className="relative rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl overflow-hidden bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800 border border-blue-600/30">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 min-h-[380px] md:min-h-[420px]">

                        {/* LEFT COLUMN (55%) */}
                        <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
                            <div>
                                <span className="text-[11px] font-black tracking-widest uppercase bg-blue-800/80 border border-blue-400/30 px-3.5 py-1.5 rounded-full inline-block text-blue-200 shadow-xs">
                                    WELCOME TO FLEETGUARD
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-xs text-white">
                                Fleet Management Made Intelligent
                            </h1>

                            <p className="text-sm md:text-base text-blue-100 font-medium leading-relaxed max-w-[520px]">
                                Manage your vehicles, monitor maintenance, track service records, and gain AI-powered insights—all from one unified platform.
                            </p>

                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <Link
                                    href="/dashboard"
                                    className="bg-white text-blue-700 hover:bg-blue-50 font-extrabold px-6 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-950/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                                    Go to Dashboard
                                </Link>
                                <Link
                                    href="/about"
                                    className="bg-blue-800/70 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl text-sm border border-blue-400/30 transition-all duration-200 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">info</span>
                                    Learn More
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className="pt-3 border-t border-white/10 flex flex-wrap gap-4 text-xs font-semibold text-blue-100/90">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">✓</span>
                                    <span>Real-time Monitoring</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">✓</span>
                                    <span>AI Predictive Maintenance</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">✓</span>
                                    <span>Enterprise Security</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN (45%) */}
                        <div className="lg:col-span-5 relative flex items-center justify-center">
                            <div className="relative w-full h-[280px] sm:h-[320px] md:h-[360px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900 group">
                                <img
                                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80"
                                    alt="Modern Enterprise Fleet Vehicles"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

                                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xl text-slate-900 animate-fade-in transition-all">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Fleet Status</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                            Live Sync
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Availability</p>
                                            <p className="text-sm font-black text-slate-900">96.8%</p>
                                        </div>
                                        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                                            <p className="text-[10px] font-bold text-emerald-700 uppercase">AI Risk</p>
                                            <p className="text-sm font-black text-emerald-700">Optimal</p>
                                        </div>
                                        <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                                            <p className="text-[10px] font-bold text-blue-700 uppercase">Services</p>
                                            <p className="text-sm font-black text-blue-700">12 Active</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* FEATURE HIGHLIGHTS (4 Cards) */}
                <div>
                    <div className="mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block">Core Platform Capabilities</span>
                        <h2 className="text-2xl font-extrabold text-slate-900">Feature Highlights</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Fleet Monitoring</p>
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[20px]">map</span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Centralized Visibility</h3>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                    Monitor every vehicle in real time with centralized fleet visibility.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Maintenance Tracking</p>
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[20px]">build_circle</span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Automated Reminders</h3>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                    Never miss scheduled maintenance with automated reminders.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Predictive Analytics</p>
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">AI-Powered Insights</h3>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                    Use AI-powered insights to identify risks before failures occur.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Fuel & Cost</p>
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[20px]">local_gas_station</span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Cost Optimization</h3>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                    Track operating expenses and improve fleet efficiency.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FLEETGUARD IN ACTION SECTION */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/90 shadow-sm animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                        {/* Image Left (45%) */}
                        <div className="lg:col-span-5 relative group">
                            <div className="relative h-[300px] sm:h-[360px] md:h-[400px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-900">
                                <img
                                    src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=80"
                                    alt="FleetGuard Enterprise Transportation Fleet"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

                                {/* Floating Statistics Card */}
                                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xl text-slate-900 transition-all">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Fleet Status</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                            Live Sync
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Availability</p>
                                            <p className="text-xs font-black text-slate-900">96.8% Availability</p>
                                        </div>
                                        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                                            <p className="text-[10px] font-bold text-emerald-700 uppercase">AI Risk</p>
                                            <p className="text-xs font-black text-emerald-700">Optimal</p>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center pt-1.5 border-t border-slate-100">
                                        <span className="text-[11px] font-bold text-blue-600">1,284 Completed Services</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Right (55%) */}
                        <div className="lg:col-span-7 space-y-6">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1 block">
                                    ENTERPRISE FLEET MANAGEMENT
                                </span>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                                    Built for Modern Fleet Operations
                                </h2>
                                <p className="mt-3 text-sm md:text-base text-slate-600 font-medium leading-relaxed">
                                    FleetGuard empowers logistics companies with intelligent fleet management tools designed to improve operational efficiency, reduce downtime, and simplify maintenance planning. Monitor every vehicle in real time, automate preventive maintenance schedules, analyze fleet performance, and make smarter decisions using AI-powered insights.
                                </p>
                            </div>

                            {/* 4 Feature Bullets */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                                        ✔
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-900">Real-Time Vehicle Tracking</h4>
                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Monitor your fleet with live operational visibility.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                                        ✔
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-900">AI Predictive Maintenance</h4>
                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Identify maintenance risks before failures occur.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                                        ✔
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-900">Intelligent Analytics</h4>
                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Turn fleet data into actionable business insights.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                                        ✔
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-900">Enterprise Security</h4>
                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Secure and reliable platform built for large organizations.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <Link
                                    href="/dashboard"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl text-sm transition-all duration-200 shadow-md flex items-center gap-2 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                                    Explore Dashboard
                                </Link>
                                <Link
                                    href="/about"
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3 rounded-xl text-sm border border-slate-200 transition-all duration-200 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">info</span>
                                    Learn More
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>

                {/* QUICK ACCESS SECTION */}
                <div>
                    <div className="mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block">Fast Navigation</span>
                        <h2 className="text-2xl font-extrabold text-slate-900">Quick Access Modules</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <Link href="/service-records" className="block group">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900">Service Records</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">View logs & invoices</p>
                            </div>
                        </Link>

                        <Link href="/maintenance-queue" className="block group">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[24px]">engineering</span>
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900">Maintenance Queue</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">Active repair queue</p>
                            </div>
                        </Link>

                        <Link href="/historical-records" className="block group">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[24px]">history</span>
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900">Historical Records</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">Archive & trends</p>
                            </div>
                        </Link>

                        <Link href="/predictive-risk" className="block group">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[24px]">insights</span>
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900">Predictive Risk</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">AI failure alerts</p>
                            </div>
                        </Link>

                        <Link href="/blog" className="block group">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[24px]">menu_book</span>
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900">Blog & Resources</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">Guides & insights</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* REPLACED FLEET OVERVIEW SECTION WITH REUSABLE DASHBOARD KPI CARDS */}
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Enterprise Metrics</span>
                            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">Fleet Overview</h2>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full mt-2 sm:mt-0 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Backend Sync
                        </span>
                    </div>

                    <KPICards vehicles={vehicles} risks={risks} loading={loading} />
                </div>



                {/* WHY FLEETGUARD (3 Cards) */}
                <div>
                    <div className="mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block">Built for Enterprise</span>
                        <h2 className="text-2xl font-extrabold text-slate-900">Why FleetGuard?</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-[22px]">sensors</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Monitoring</h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                Gain continuous telematics visibility into every asset, route deviation, engine diagnostic fault code, and fuel consumption trend across your fleet.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Predictive Maintenance</h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                Detect component degradation early using machine learning models to schedule repairs prior to costly on-road mechanical breakdowns.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-[22px]">security</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Enterprise Security</h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                Role-based access control, encrypted telemetry logs, and compliance audit trails engineered to satisfy regulatory requirements.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CALL TO ACTION BANNER */}
                <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800 rounded-3xl py-12 px-6 text-white shadow-xl border border-blue-600/30 text-center relative overflow-hidden flex flex-col justify-center items-center min-h-[220px] md:min-h-[260px]">
                    {/* Subtle Glow & Background Accent */}
                    <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                            Ready to Transform Your Fleet Operations?
                        </h2>

                        <p className="mt-5 text-base md:text-lg leading-7 text-blue-100 font-medium max-w-2xl text-center">
                            FleetGuard helps you monitor vehicles, automate maintenance, track service records, and optimize fleet performance with AI-powered insights—all from one unified platform.
                        </p>

                        <div className="mt-6">
                            <Link
                                href="/dashboard"
                                className="bg-white text-blue-700 hover:bg-blue-50 font-extrabold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-950/20 transition-all hover:scale-105 text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </LayoutWrapper >
    );
}