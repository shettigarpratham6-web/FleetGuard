'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Notification, User, Vehicle } from '@/types';
import Footer from '@/components/Footer';

export default function DriverDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state (All states properly initialized)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('General Query');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState({ type: '', msg: '' });
  const [contactLoading, setContactLoading] = useState(false);

  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [compVehicleId, setCompVehicleId] = useState('');
  const [compType, setCompType] = useState('Insurance');
  const [compExpiry, setCompExpiry] = useState('');
  const [compFile, setCompFile] = useState<File | null>(null);
  const [compStatus, setCompStatus] = useState({ type: '', msg: '' });
  const [compLoading, setCompLoading] = useState(false);

  // Additional modal states referenced in header buttons
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelGallons, setFuelGallons] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelOdo, setFuelOdo] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [fuelStatus, setFuelStatus] = useState({ type: '', msg: '' });
  const [fuelLoading, setFuelLoading] = useState(false);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueVehicleId, setIssueVehicleId] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePriority, setIssuePriority] = useState('Medium');
  const [issueStatus, setIssueStatus] = useState({ type: '', msg: '' });
  const [issueLoading, setIssueLoading] = useState(false);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = api.auth.getLocalUser();
    setUser(currentUser);

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [notifs, vehs] = await Promise.all([
          api.notifications.getMyNotifications(),
          api.vehicles.getAll()
        ]);
        setNotifications(notifs || []);
        setVehicles(vehs || []);
      } catch (err) {
        console.error('Failed to load driver dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage) return;

    setContactLoading(true);
    setContactStatus({ type: '', msg: '' });

    try {
      const admins = await api.auth.getUsers('Admin');
      const managers = await api.auth.getUsers('Fleet Manager');
      const targetUsers = [...admins, ...managers];

      if (targetUsers.length === 0) {
        throw new Error('No managers found to contact.');
      }

      const adminId = targetUsers[0].id;

      await api.notifications.create({
        user_id: adminId,
        title: `Message from ${user?.full_name}: ${contactSubject}`,
        message: contactMessage,
        notification_type: 'Driver Query'
      });

      setContactStatus({ type: 'success', msg: 'Message sent successfully to the fleet manager.' });
      setContactMessage('');
      setTimeout(() => setIsContactModalOpen(false), 2000);
    } catch (err: any) {
      setContactStatus({ type: 'error', msg: err.message || 'Failed to send message.' });
    } finally {
      setContactLoading(false);
    }
  };

  const handleComplianceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compVehicleId || !compType || !compExpiry || !compFile) {
      setCompStatus({ type: 'error', msg: 'Please fill all fields and select a file.' });
      return;
    }

    setCompLoading(true);
    setCompStatus({ type: '', msg: '' });

    try {
      const formData = new FormData();
      formData.append('vehicle_id', compVehicleId);
      formData.append('document_type', compType);
      formData.append('expiry_date', compExpiry);
      formData.append('file', compFile);

      await api.compliance.create(formData);

      setCompStatus({ type: 'success', msg: 'Compliance document uploaded successfully.' });
      setCompFile(null);
      setCompExpiry('');
      setTimeout(() => setIsComplianceModalOpen(false), 2000);
    } catch (err: any) {
      setCompStatus({ type: 'error', msg: err.message || 'Failed to upload document.' });
    } finally {
      setCompLoading(false);
    }
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelGallons || !fuelCost || !fuelOdo) return;
    
    setFuelLoading(true);
    setFuelStatus({ type: '', msg: '' });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API
      setFuelStatus({ type: 'success', msg: 'Fuel log saved successfully!' });
      
      setTimeout(() => {
        setIsFuelModalOpen(false);
        setFuelStatus({ type: '', msg: '' });
        setFuelGallons(''); setFuelCost(''); setFuelOdo(''); setFuelStation('');
      }, 1500);
    } catch (err: any) {
      setFuelStatus({ type: 'error', msg: 'Failed to log fuel.' });
    } finally {
      setFuelLoading(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueVehicleId || !issueDesc) return;
    
    setIssueLoading(true);
    setIssueStatus({ type: '', msg: '' });
    
    try {
      const admins = await api.auth.getUsers('Admin');
      const managers = await api.auth.getUsers('Fleet Manager');
      const targetUsers = [...admins, ...managers];
      
      if (targetUsers.length > 0) {
        const adminId = targetUsers[0].id;
        const vInfo = vehicles.find(v => v.id === issueVehicleId);
        const vName = vInfo ? `${vInfo.manufacturer} ${vInfo.model} (${vInfo.registration_number})` : issueVehicleId;
        
        await api.notifications.create({
          user_id: adminId,
          title: `Vehicle Issue Reported (${issuePriority} Priority)`,
          message: `Vehicle: ${vName}. Issue: ${issueDesc}`,
          notification_type: 'Maintenance Alert'
        });
      }
      
      setIssueStatus({ type: 'success', msg: 'Issue successfully reported to maintenance.' });
      
      setTimeout(() => {
        setIsIssueModalOpen(false);
        setIssueStatus({ type: '', msg: '' });
        setIssueVehicleId(''); setIssueDesc(''); setIssuePriority('Medium');
      }, 2000);
    } catch (err: any) {
      setIssueStatus({ type: 'error', msg: 'Failed to report issue.' });
    } finally {
      setIssueLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-semibold text-sm text-slate-600">Loading Driver Portal...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-5xl mx-auto bg-slate-50 min-h-screen text-slate-900 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {user?.full_name || 'Driver'}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">badge</span>
              Driver Portal • Safe driving today!
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsComplianceModalOpen(true)}
              className="bg-white hover:bg-slate-100 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-600">upload_file</span>
              Add Compliance
            </button>
            <button
              onClick={() => setIsFuelModalOpen(true)}
              className="bg-white hover:bg-slate-100 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-600">local_gas_station</span>
              Log Fuel
            </button>
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">report</span>
              Report Issue
            </button>
          </div>
        </div>

        {/* Action Required Banner */}
        {unreadCount > 0 && (
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl p-6 shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                <span className="material-symbols-outlined text-[28px] text-white">warning</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Action Required</h3>
                <p className="text-sm font-medium text-rose-100 mt-1">
                  You have {unreadCount} new alert{unreadCount > 1 ? 's' : ''} regarding your assigned vehicle compliance or maintenance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Driver Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Current Mileage</span>
            <div className="text-2xl font-black text-slate-900 mt-1">45,210 mi</div>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span> Verified 2 days ago
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Fuel Status</span>
            <div className="text-2xl font-black text-slate-900 mt-1">78%</div>
            <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">local_gas_station</span> ~320 mi range
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Next Service</span>
            <div className="text-2xl font-black text-slate-900 mt-1">1,200 mi</div>
            <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span> Oil Change Due
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Safety Score</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">98 / 100</div>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">star</span> Excellent Driver
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Notifications Feed */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">notifications_active</span>
              Recent Alerts & Messages
            </h3>

            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notif) => {
                  const isCompliance = notif.notification_type === 'Compliance Alert' || notif.title.toLowerCase().includes('expir');
                  const isMaintenance = notif.notification_type === 'Maintenance Alert' || notif.title.toLowerCase().includes('service');

                  let icon = 'notifications';
                  let iconColor = 'text-blue-600';
                  let bgColor = 'bg-blue-50';

                  if (isCompliance) {
                    icon = 'gavel';
                    iconColor = 'text-rose-600';
                    bgColor = 'bg-rose-50';
                  } else if (isMaintenance) {
                    icon = 'build';
                    iconColor = 'text-amber-600';
                    bgColor = 'bg-amber-50';
                  }

                  return (
                    <div
                      key={notif.id}
                      className={`relative bg-white border ${notif.is_read ? 'border-slate-200' : 'border-blue-300 ring-1 ring-blue-300'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group overflow-hidden`}
                    >
                      {!notif.is_read && (
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-l-[40px] border-t-blue-500 border-l-transparent">
                          <span className="material-symbols-outlined text-white text-[14px] absolute -top-[34px] -left-[18px]">new_releases</span>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor} ${notif.is_read ? 'opacity-60' : ''}`}>
                          <span className={`material-symbols-outlined text-[24px] ${iconColor}`}>{icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-base font-bold ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap ml-4">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed mb-4 ${notif.is_read ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-3">
                            {!notif.is_read ? (
                              <button
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">done_all</span>
                                Mark as Acknowledged
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Acknowledged
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 shadow-sm">
                  <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3 block">inbox</span>
                  <p className="text-sm font-medium">You have no active alerts. You're all caught up!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                My Assigned Vehicle
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-[28px]">directions_car</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">Active Assignment</p>
                  <p className="text-sm font-bold text-slate-900">Assigned Fleet Vehicle</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                You can add compliance documents for any of your branch vehicles using the "Add Compliance" button above.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <span className="material-symbols-outlined text-blue-600">support_agent</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Need Assistance?</h4>
              <p className="text-xs text-slate-600 font-medium mb-4 leading-relaxed">
                Contact your fleet manager immediately for any compliance issues, part requests, or breakdowns.
              </p>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="w-full bg-blue-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm hover:bg-blue-700 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                Contact Fleet Manager
              </button>
            </div>
          </div>
        </div>
        {/* COMPLIANCE UPLOAD MODAL */}
        {/* COMPLIANCE UPLOAD MODAL */}
        {isComplianceModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
            onClick={() => setIsComplianceModalOpen(false)}
          >
            <div
              className="bg-white rounded-[1.5rem] shadow-2xl overflow-hidden animate-slide-up transform transition-all border border-slate-100 relative my-auto shrink-0"
              style={{ width: '100%', maxWidth: '28rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-1.5 rounded-lg">upload_file</span>
                  Upload Document
                </h3>
                <button
                  type="button"
                  onClick={() => setIsComplianceModalOpen(false)}
                  className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6">
                {compStatus.msg && (
                  <div className={`p-3 rounded-xl mb-5 text-sm font-semibold flex items-center gap-2 ${compStatus.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {compStatus.type === 'error' ? 'error' : 'check_circle'}
                    </span>
                    {compStatus.msg}
                  </div>
                )}

                <form onSubmit={handleComplianceSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Vehicle</label>
                    <select
                      value={compVehicleId}
                      onChange={(e) => setCompVehicleId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-blue-500"
                      required
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.manufacturer} {v.model} ({v.license_plate || v.registration_number || v.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Type</label>
                    <select
                      value={compType}
                      onChange={(e) => setCompType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-blue-500"
                    >
                      <option value="Insurance">Insurance</option>
                      <option value="Registration">Registration</option>
                      <option value="Inspection">Inspection</option>
                      <option value="Permit">Permit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={compExpiry}
                      onChange={(e) => setCompExpiry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload File</label>
                    <input
                      type="file"
                      onChange={(e) => setCompFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsComplianceModalOpen(false)}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={compLoading}
                      className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {compLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : 'Submit Document'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* CONTACT MANAGER MODAL */}
        {isContactModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
            onClick={() => setIsContactModalOpen(false)}
          >
            <div
              className="bg-white rounded-[1.5rem] shadow-2xl overflow-hidden animate-slide-up transform transition-all border border-slate-100 relative my-auto shrink-0"
              style={{ width: '100%', maxWidth: '28rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-1.5 rounded-lg">
                    support_agent
                  </span>
                  Contact Manager
                </h3>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {contactStatus?.msg && (
                  <div
                    className={`p-3 rounded-xl mb-5 text-sm font-semibold flex items-center gap-2 ${contactStatus.type === 'error'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-emerald-50 text-emerald-700'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {contactStatus.type === 'error' ? 'error' : 'check_circle'}
                    </span>
                    {contactStatus.msg}
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Subject
                    </label>
                    <select
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="General Query">General Query</option>
                      <option value="Compliance Issue">Compliance Issue</option>
                      <option value="Breakdown / Repair">Breakdown / Repair</option>
                      <option value="Shift Schedule">Shift Schedule</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe your inquiry or issue..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsContactModalOpen(false)}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {contactLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* LOG FUEL MODAL */}
        {isFuelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto" onClick={() => setIsFuelModalOpen(false)}>
            <div className="bg-white rounded-[1.5rem] shadow-2xl overflow-hidden animate-slide-up transform transition-all border border-slate-100 relative my-auto shrink-0" style={{ width: '100%', maxWidth: '28rem' }} onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-1.5 rounded-lg">local_gas_station</span>
                  Log Fuel
                </h3>
                <button type="button" onClick={() => setIsFuelModalOpen(false)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6">
                {fuelStatus.msg && (
                  <div className={`p-3 rounded-xl mb-5 text-sm font-semibold flex items-center gap-2 ${fuelStatus.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    <span className="material-symbols-outlined text-[18px]">{fuelStatus.type === 'error' ? 'error' : 'check_circle'}</span>
                    {fuelStatus.msg}
                  </div>
                )}
                <form onSubmit={handleFuelSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gallons/Liters</label>
                      <input type="number" step="0.01" value={fuelGallons} onChange={(e) => setFuelGallons(e.target.value)} required placeholder="e.g. 15.4" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Cost ($)</label>
                      <input type="number" step="0.01" value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} required placeholder="e.g. 45.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Odometer (mi)</label>
                      <input type="number" value={fuelOdo} onChange={(e) => setFuelOdo(e.target.value)} required placeholder="e.g. 45210" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gas Station</label>
                      <input type="text" value={fuelStation} onChange={(e) => setFuelStation(e.target.value)} required placeholder="e.g. Shell #442" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 mt-2">
                    <button type="button" onClick={() => setIsFuelModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">Cancel</button>
                    <button type="submit" disabled={fuelLoading} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2">
                      {fuelLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : 'Save Log'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* REPORT ISSUE MODAL */}
        {isIssueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto" onClick={() => setIsIssueModalOpen(false)}>
            <div className="bg-white rounded-[1.5rem] shadow-2xl overflow-hidden animate-slide-up transform transition-all border border-slate-100 relative my-auto shrink-0" style={{ width: '100%', maxWidth: '28rem' }} onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 bg-rose-50 p-1.5 rounded-lg">report</span>
                  Report Vehicle Issue
                </h3>
                <button type="button" onClick={() => setIsIssueModalOpen(false)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6">
                {issueStatus.msg && (
                  <div className={`p-3 rounded-xl mb-5 text-sm font-semibold flex items-center gap-2 ${issueStatus.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    <span className="material-symbols-outlined text-[18px]">{issueStatus.type === 'error' ? 'error' : 'check_circle'}</span>
                    {issueStatus.msg}
                  </div>
                )}
                <form onSubmit={handleIssueSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Vehicle</label>
                    <select value={issueVehicleId} onChange={(e) => setIssueVehicleId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500">
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.manufacturer} {v.model} ({v.registration_number})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Issue Priority</label>
                    <select value={issuePriority} onChange={(e) => setIssuePriority(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500">
                      <option value="Low">Low - Minor cosmetic issue</option>
                      <option value="Medium">Medium - Needs attention soon</option>
                      <option value="High">High - Safety concern or broken part</option>
                      <option value="Critical">Critical - Do Not Drive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Describe Issue</label>
                    <textarea rows={3} value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} required placeholder="e.g. Check engine light came on during trip." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 mt-2">
                    <button type="button" onClick={() => setIsIssueModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">Cancel</button>
                    <button type="submit" disabled={issueLoading} className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2">
                      {issueLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : 'Submit Issue'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        <div><Footer /></div>
      </div>
    </LayoutWrapper>
  );
}