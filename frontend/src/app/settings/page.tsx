'use client';

import React, { useState } from 'react';
import { api } from '@/services/api';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'fleet'>('profile');
    const [saved, setSaved] = useState(false);

    // Form states
    // Form states
    // Form states
    const currentUser = api.auth.getLocalUser();
    const [formData, setFormData] = useState({
        name: currentUser?.username || 'Admin User',
        email: currentUser?.email || 'admin@fleetmaster.com',
        role: currentUser?.role || 'Fleet Manager',
        emailAlerts: true,
        smsAlerts: false,
        maintenanceReminderDays: 7,
        fuelThresholdPercent: 15,
    });
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Manage your profile, system parameters, and notification preferences
                    </p>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl animate-fade-in">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Settings saved successfully!
                    </div>
                )}
            </div>

            {/* Settings Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
                {[
                    { id: 'profile', label: 'Profile & Account', icon: 'person' },
                    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
                    { id: 'fleet', label: 'Fleet Preferences', icon: 'local_shipping' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 pb-3 font-semibold text-sm transition-all border-b-2 ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Card */}
            <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="space-y-4 max-w-xl">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                            Account Details
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role</label>
                            <input
                                type="text"
                                disabled
                                value={formData.role}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm cursor-not-allowed font-medium"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">Role privileges are managed by system administrators.</p>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="space-y-4 max-w-xl">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                            Notification Rules
                        </h3>

                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Email Notifications</p>
                                <p className="text-xs text-slate-500">Receive automated daily summary reports and urgent alerts via email.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={formData.emailAlerts}
                                onChange={(e) => setFormData({ ...formData, emailAlerts: e.target.checked })}
                                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">SMS Critical Alerts</p>
                                <p className="text-xs text-slate-500">Send text messages for critical breakdown and maintenance emergencies.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={formData.smsAlerts}
                                onChange={(e) => setFormData({ ...formData, smsAlerts: e.target.checked })}
                                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                            />
                        </div>
                    </div>
                )}

                {/* Fleet Preferences Tab */}
                {activeTab === 'fleet' && (
                    <div className="space-y-4 max-w-xl">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                            Automation Thresholds
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Maintenance Reminder Lead Time (Days)
                            </label>
                            <input
                                type="number"
                                value={formData.maintenanceReminderDays}
                                onChange={(e) => setFormData({ ...formData, maintenanceReminderDays: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Low Fuel Alert Level (%)
                            </label>
                            <input
                                type="number"
                                value={formData.fuelThresholdPercent}
                                onChange={(e) => setFormData({ ...formData, fuelThresholdPercent: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">save</span>
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}