'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function PreTripChecklistPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [odometer, setOdometer] = useState('');

  const checklistItems = [
    { id: 'tyres', label: 'Tyres condition and pressure' },
    { id: 'brakes', label: 'Brakes responsive' },
    { id: 'fuel', label: 'Fuel level sufficient' },
    { id: 'lights', label: 'Headlights and indicators working' },
    { id: 'horn', label: 'Horn functional' },
    { id: 'engine', label: 'No check engine lights' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock API Call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => router.push('/driver'), 1500);
    }, 1000);
  };

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pre-Trip Checklist & Odometer</h2>
          <p className="text-slate-500 text-sm mt-1">Complete this verification before starting your duty.</p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-emerald-800">Duty Authorized!</h3>
            <p className="text-emerald-600 font-medium">Checklist submitted and odometer updated. Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <label className="block text-sm font-bold text-slate-900 mb-2">Update Current Odometer (Miles) *</label>
              <input 
                type="number" 
                required 
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full max-w-sm border border-slate-200 rounded-xl p-3 font-mono font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="e.g. 45200" 
              />
            </div>
            
            <div className="p-6 space-y-4">
              <h3 className="font-bold text-slate-900 mb-4">Vehicle Inspection</h3>
              {checklistItems.map(item => (
                <label key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input type="checkbox" required className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="font-semibold text-slate-700">{item.label}</span>
                </label>
              ))}
              
              <div className="pt-4">
                <label className="block text-sm font-bold text-slate-900 mb-2">Additional Comments (Optional)</label>
                <textarea rows={3} className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any issues to report?"></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => router.push('/driver')} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2">
                {isSubmitting ? 'Verifying...' : 'Submit & Start Duty'}
                {!isSubmitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </div>
          </form>
        )}
      </div>
    </LayoutWrapper>
  );
}
