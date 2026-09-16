'use client';

import React from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import Footer from '@/components/footer';

export default function SupportPage() {
  return (
    <LayoutWrapper>
      <div className="bg-slate-50 min-h-screen p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
        <div className="pb-4 border-b border-slate-200">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-1">
            Help & Resources
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Support Center
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Need assistance with FleetGuard? Our support team is available 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <h3 className="font-bold text-slate-900">Email Support</h3>
            <p className="text-xs text-slate-500">Reach out to our technical helpdesk for complex technical issues.</p>
            <a href="mailto:support@fleetguard.com" className="text-xs font-bold text-blue-600 hover:underline block">
              support@fleetguard.com
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">call</span>
            </div>
            <h3 className="font-bold text-slate-900">Toll-Free Hotline</h3>
            <p className="text-xs text-slate-500">Immediate assistance for vehicle roadside or dispatch emergencies.</p>
            <p className="text-xs font-bold text-emerald-600">+1 (800) 555-FLEET</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <h3 className="font-bold text-slate-900">User Guides</h3>
            <p className="text-xs text-slate-500">Browse documentation and tutorials on roles and features.</p>
            <a href="/about" className="text-xs font-bold text-purple-600 hover:underline block">
              Read Documentation &rarr;
            </a>
          </div>
        </div>

        <Footer />
      </div>
    </LayoutWrapper>
  );
}
