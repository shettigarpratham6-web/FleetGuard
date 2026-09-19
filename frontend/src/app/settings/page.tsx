'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'fleet'>('notifications');
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);

    const currentUser = api.auth.getLocalUser();
    const [formData, setFormData] = useState({
        name: currentUser?.full_name || currentUser?.username || 'Demo Manager',
        email: currentUser?.email || 'manager@fleetguard.com',
        role: currentUser?.role || 'Fleet Manager',
        phone: currentUser?.phone_number || '+1 (555) 234-5678',
        emailAlerts: true,
        smsAlerts: false,
        fuelThresholdPercent: 15,
    });

    const [leadDays, setLeadDays] = useState<number[]>([30, 15, 7]);
    const [newLeadDay, setNewLeadDay] = useState<string>('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await api.notifications.getSettings();
                if (settings && Array.isArray(settings.lead_days)) {
                    setLeadDays(settings.lead_days);
                    setFormData(prev => ({
                        ...prev,
                        emailAlerts: settings.enable_email_alerts !== false,
                    }));
                }
            } catch (err) {
                console.warn('Unable to load alert settings from backend, using defaults:', err);
            }
        };
        fetchSettings();
    }, []);

    const handleAddLeadDay = () => {
        const num = parseInt(newLeadDay, 10);
        if (!isNaN(num) && num > 0 && !leadDays.includes(num)) {
            const updated = [...leadDays, num].sort((a, b) => b - a);
            setLeadDays(updated);
            setNewLeadDay('');
        }
    };

    const handleRemoveLeadDay = (dayToRemove: number) => {
        setLeadDays(leadDays.filter(d => d !== dayToRemove));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.notifications.updateSettings({
                lead_days: leadDays,
                enable_email_alerts: formData.emailAlerts,
                enable_in_app_alerts: true
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save settings:', err);
            alert('Failed to save settings to server.');
        } finally {
            setSaving(false);
        }
    };

    const handleTriggerScan = async () => {
        setScanning(true);
        setScanResult(null);
        try {
            const res = await api.notifications.triggerExpiryScan();
            const details = res?.details || res || {};
            setScanResult(`Scan complete! Evaluated ${details.evaluatedDocs || 0} compliance docs and ${details.evaluatedServices || 0} service records. Created ${details.createdCount || 0} new alert notifications.`);
        } catch (err: any) {
            console.error('Failed to trigger scan:', err);
            setScanResult(`Error running scan: ${err.message || 'Server error'}`);
        } finally {
            setScanning(false);
        }
    };

    const displayName = formData.name || 'Demo Manager';

    return (
        <LayoutWrapper>
            <div className="p-6 md:p-8 flex flex-col gap-6 w-full max-w-5xl mx-auto" style={{ width: '100%', minWidth: '100%' }}>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 w-full" style={{ width: '100%', minWidth: '100%' }}>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Preferences</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Configure automated expiry lead times, account profile, and fleet automation parameters.
                        </p>
                    </div>
                    {saved && (
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl animate-fade-in shrink-0">
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Settings saved successfully!
                        </div>
                    )}
                </div>

                {/* Settings Navigation Tabs */}
                <div className="flex border-b border-slate-200 gap-6 w-full" style={{ width: '100%', minWidth: '100%' }}>
                    {[
                        { id: 'notifications', label: 'Expiry Alerts & Lead Times', icon: 'notifications' },
                        { id: 'profile', label: 'Profile & Account', icon: 'person' },
                        { id: 'fleet', label: 'Fleet Preferences', icon: 'directions_car' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`flex items-center gap-2 pb-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Form */}
                <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col gap-6 w-full" style={{ width: '100%', minWidth: '100%' }}>
                    
                    {/* 1. Expiry Alerts & Lead Times Tab */}
                    {activeTab === 'notifications' && (
                        <div className="flex flex-col gap-6 w-full" style={{ width: '100%', minWidth: '100%' }}>
                            <div className="border-b border-slate-100 pb-3 w-full">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Configurable Expiry Alert Lead Times
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Specify how many days before due date automated alerts should trigger for compliance documents (Insurance, PUC, Fitness, Inspection) and scheduled maintenance.
                                </p>
                            </div>

                            {/* Lead Times Tag Manager */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-3 w-full" style={{ width: '100%', minWidth: '100%' }}>
                                <label className="block w-full text-xs font-bold text-slate-700 uppercase tracking-wide">
                                    Active Alert Lead Thresholds (Days Before Expiry)
                                </label>
                                
                                <div className="flex flex-wrap gap-2 items-center w-full">
                                    {leadDays.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No lead thresholds configured. Add one below.</p>
                                    ) : (
                                        leadDays.map((day) => (
                                            <div
                                                key={day}
                                                className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs"
                                            >
                                                <span className="material-symbols-outlined text-sm text-blue-600">schedule</span>
                                                <span>{day} Days Before Due</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLeadDay(day)}
                                                    className="ml-1 text-slate-400 hover:text-red-600 transition-colors focus:outline-none cursor-pointer"
                                                    title="Remove lead threshold"
                                                >
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add New Threshold */}
                                <div className="pt-2 flex items-center gap-2 max-w-sm">
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        placeholder="e.g. 30, 15, 7"
                                        value={newLeadDay}
                                        onChange={(e) => setNewLeadDay(e.target.value)}
                                        className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddLeadDay}
                                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        Add Threshold
                                    </button>
                                </div>
                            </div>

                            {/* On-Demand Scan Trigger */}
                            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full" style={{ width: '100%', minWidth: '100%' }}>
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-amber-600 text-base">autorenew</span>
                                        Automated Scan Engine
                                    </h4>
                                    <p className="text-xs text-amber-800/80 mt-0.5">
                                        The system automatically scans daily at midnight. You can also trigger an immediate scan now.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleTriggerScan}
                                    disabled={scanning}
                                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                                >
                                    <span className={`material-symbols-outlined text-sm ${scanning ? 'animate-spin' : ''}`}>
                                        {scanning ? 'sync' : 'play_arrow'}
                                    </span>
                                    {scanning ? 'Scanning...' : 'Run Scan Now'}
                                </button>
                            </div>

                            {scanResult && (
                                <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-700 font-medium animate-fade-in w-full">
                                    {scanResult}
                                </div>
                            )}

                            {/* Notification Channels */}
                            <div className="flex flex-col gap-3 pt-2 w-full" style={{ width: '100%', minWidth: '100%' }}>
                                <h4 className="text-sm font-bold text-slate-800">Notification Delivery Channels</h4>
                                
                                <div className="flex items-center justify-between py-2 border-b border-slate-100 w-full" style={{ width: '100%', minWidth: '100%' }}>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">In-App Notifications</p>
                                        <p className="text-xs text-slate-500">Deliver in-app alerts directly to driver and manager notification feeds.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={true}
                                        disabled
                                        className="w-5 h-5 accent-blue-600 rounded cursor-not-allowed opacity-80"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-slate-100 w-full" style={{ width: '100%', minWidth: '100%' }}>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Email Digest Notifications</p>
                                        <p className="text-xs text-slate-500">Receive automated daily compliance summaries via email.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.emailAlerts}
                                        onChange={(e) => setFormData({ ...formData, emailAlerts: e.target.checked })}
                                        className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Profile & Account Tab */}
                    {activeTab === 'profile' && (
                        <div className="flex flex-col gap-6 w-full" style={{ width: '100%', minWidth: '100%' }}>
                            {/* Rich Profile Banner Header Card */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 shadow-sm relative overflow-hidden w-full" style={{ width: '100%', minWidth: '100%' }}>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-slate-900 to-blue-950/60 pointer-events-none" />
                                
                                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-left w-full" style={{ width: '100%' }}>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="w-20 h-20 rounded-full border-4 border-white/20 bg-slate-800 overflow-hidden shrink-0 shadow-lg ring-2 ring-blue-500/30">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&size=128`}
                                                alt={displayName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                                                {displayName}
                                                <span className="material-symbols-outlined text-blue-400 text-base fill">verified</span>
                                            </h2>
                                            <p className="text-xs text-slate-300 font-medium mt-0.5">{formData.email}</p>
                                            
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                                                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                                                    Role: {formData.role}
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    Account Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href="/profile"
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 shrink-0"
                                    >
                                        <span>Full Profile Page</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Form Input Section */}
                            <div className="border-b border-slate-100 pb-2 pt-2 w-full">
                                <h3 className="text-base font-bold text-slate-900">
                                    Personal Information & Credentials
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Update your personal contact details and view administrative privileges.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" style={{ width: '100%', minWidth: '100%' }}>
                                <div className="flex flex-col gap-2 w-full" style={{ width: '100%' }}>
                                    <label className="block w-full text-xs font-bold text-slate-700 uppercase tracking-wide">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-sm font-semibold bg-white"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div className="flex flex-col gap-2 w-full" style={{ width: '100%' }}>
                                    <label className="block w-full text-xs font-bold text-slate-700 uppercase tracking-wide">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-sm font-semibold bg-white"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div className="flex flex-col gap-2 w-full" style={{ width: '100%' }}>
                                    <label className="block w-full text-xs font-bold text-slate-700 uppercase tracking-wide">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-sm font-semibold bg-white"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div className="flex flex-col gap-2 w-full" style={{ width: '100%' }}>
                                    <label className="block w-full text-xs font-bold text-slate-700 uppercase tracking-wide">
                                        Role & Access Level
                                    </label>
                                    <input
                                        type="text"
                                        disabled
                                        value={formData.role}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-bold cursor-not-allowed"
                                        style={{ width: '100%' }}
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Role privileges are managed by system administrators.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Fleet Preferences Tab */}
                    {activeTab === 'fleet' && (
                        <div className="flex flex-col gap-6 w-full" style={{ width: '100%', minWidth: '100%' }}>
                            <div className="border-b border-slate-100 pb-3 w-full">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Automation & Telematics Thresholds
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Configure global fleet triggers and telematics threshold parameters.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 w-full max-w-md" style={{ width: '100%', minWidth: '300px' }}>
                                <label className="block w-full text-xs font-bold text-slate-700 uppercase tracking-wide">
                                    Low Fuel Alert Threshold (%)
                                </label>
                                <div className="relative w-full" style={{ width: '100%' }}>
                                    <input
                                        type="number"
                                        min="5"
                                        max="50"
                                        value={formData.fuelThresholdPercent}
                                        onChange={(e) => setFormData({ ...formData, fuelThresholdPercent: Number(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-sm font-bold bg-white"
                                        style={{ width: '100%' }}
                                    />
                                    <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">% Remaining</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Automated warning alerts will trigger when vehicle fuel levels drop below this percentage.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Save Button Footer */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end w-full" style={{ width: '100%', minWidth: '100%' }}>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">save</span>
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </LayoutWrapper>
    );
}