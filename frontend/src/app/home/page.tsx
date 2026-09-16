'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, MaintenanceRisk } from '@/types';
import Footer from "@/components/footer";

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

                        {/* LEFT COLUMN */}
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

                        {/* RIGHT COLUMN */}
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

                {/* FEATURE HIGHLIGHTS */}
                <div>
                    <div className="mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block">Core Platform Capabilities</span>
                        <h2 className="text-2xl font-extrabold text-slate-900">Feature Highlights</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Card 1 */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">directions_car</span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-base mb-1">Fleet Management</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Track all vehicle details, specs, assignments, and branch locations in real time.
                                </p>
                            </div>
                            <Link href="/vehicles" className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                View Vehicles →
                            </Link>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">psychology</span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-base mb-1">Predictive AI Risks</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Proactively detect breakdown risks before failures occur using smart analytics.
                                </p>
                            </div>
                            <Link href="/predictive-risk" className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                Check Risks →
                            </Link>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">verified</span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-base mb-1">Compliance Docs</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Store insurance, registrations, and regulatory compliance documents effortlessly.
                                </p>
                            </div>
                            <Link href="/compliance" className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                                Manage Documents →
                            </Link>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">fact_check</span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-base mb-1">Inspection Checklists</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Perform routine driver pre-trip inspection logs and track service approvals.
                                </p>
                            </div>
                            <Link href="/checklist" className="mt-4 text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1">
                                Start Inspection →
                            </Link>
                        </div>

                    </div>
                </div>

                {/* RECENT ACTIVITY TABLE */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Recent Service Activity</h2>
                            <p className="text-xs text-slate-500">Latest maintenance logs and inspection updates across all branches.</p>
                        </div>
                        <Link href="/service-records" className="text-xs font-bold text-blue-600 hover:underline">
                            View All Logs
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4">Vehicle</th>
                                    <th className="py-3 px-4">Activity Description</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentActivities.map((act) => (
                                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3 px-4 font-semibold text-slate-900">{act.vehicle}</td>
                                        <td className="py-3 px-4">{act.activity}</td>
                                        <td className="py-3 px-4 text-slate-500">{act.date}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${act.statusColor}`}>
                                                {act.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Footer />
            </div>
        </LayoutWrapper>
    );
}