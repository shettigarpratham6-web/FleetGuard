'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-slate-900 text-slate-300 font-sans border-t border-slate-800 mt-auto">
            {/* Main Footer Container */}
            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">

                    {/* Brand Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-600/30">
                                FG
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">
                                Fleet<span className="text-blue-500">Guard</span>
                            </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
                            Next-generation fleet management & AI-powered telematics platform. Streamlining vehicle tracking, pre-trip safety checklists, compliance documents, and predictive maintenance.
                        </p>

                        <div className="flex items-center gap-3 text-xs text-slate-400 pt-2">
                            <span className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-lg text-emerald-400 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                System Operational
                            </span>
                            <span className="bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-lg text-slate-300 font-semibold">
                                v2.4.0
                            </span>
                        </div>
                    </div>

                    {/* Column 2: Platform Modules */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                            Core Modules
                        </h3>
                        <ul className="space-y-2 text-xs font-medium text-slate-400">
                            <li>
                                <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
                                    Fleet Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/vehicles" className="hover:text-blue-400 transition-colors">
                                    Vehicle Assets
                                </Link>
                            </li>
                            <li>
                                <Link href="/checklist" className="hover:text-blue-400 transition-colors">
                                    Pre-Trip Checklists
                                </Link>
                            </li>
                            <li>
                                <Link href="/assignment" className="hover:text-blue-400 transition-colors">
                                    Driver Dispatches
                                </Link>
                            </li>
                            <li>
                                <Link href="/compliance" className="hover:text-blue-400 transition-colors">
                                    Compliance Vault
                                </Link>
                            </li>
                            <li>
                                <Link href="/predictive-risk" className="hover:text-blue-400 transition-colors">
                                    AI Maintenance Risk
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Maintenance & Logistics */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                            Operations
                        </h3>
                        <ul className="space-y-2 text-xs font-medium text-slate-400">
                            <li>
                                <Link href="/service-records" className="hover:text-blue-400 transition-colors">
                                    Service Records
                                </Link>
                            </li>
                            <li>
                                <Link href="/maintenance-queue" className="hover:text-blue-400 transition-colors">
                                    Maintenance Queue
                                </Link>
                            </li>
                            <li>
                                <Link href="/historical-records" className="hover:text-blue-400 transition-colors">
                                    Historical Archives
                                </Link>
                            </li>
                            <li>
                                <Link href="/driver" className="hover:text-blue-400 transition-colors">
                                    Driver Portal
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="hover:text-blue-400 transition-colors">
                                    Logistics Resources
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Contact & Support */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                            Support & Contact
                        </h3>
                        <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                            <li className="flex items-center gap-2">
                                <span className="text-blue-400">📧</span>
                                <a href="mailto:support@fleetguard.com" className="hover:text-white transition-colors">
                                    support@fleetguard.com
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-400">📞</span>
                                <span>+1 (800) 555-FLEET</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-400">📍</span>
                                <span>Fleet Operations Hub, USA</span>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Sub-Footer Bar */}
            <div className="bg-slate-950 border-t border-slate-800/80 py-6 px-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
                    <div>
                        © {currentYear} FleetGuard Logistics Enterprise. All rights reserved.
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="#" className="hover:text-slate-300 transition-colors">
                            Privacy Policy
                        </a>
                        <a href="#" className="hover:text-slate-300 transition-colors">
                            Terms of Service
                        </a>
                        <a href="#" className="hover:text-slate-300 transition-colors">
                            Security Overview
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}