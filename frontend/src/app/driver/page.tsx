'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Notification, User, Vehicle } from '@/types';

export default function DriverDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
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
        
        // Let driver select from vehicles in their branch (or all if not filtered yet)
        setVehicles(vehs || []);
        if (vehs && vehs.length > 0) {
          setCompVehicleId(vehs[0].id);
        }
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
      // Find admins/managers to notify
      const admins = await api.auth.getUsers('Admin');
      const managers = await api.auth.getUsers('Fleet Manager');
      const targetUsers = [...admins, ...managers];

      if (targetUsers.length === 0) {
        throw new Error('No managers found to contact.');
      }

      // Send to the first admin/manager for simplicity
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
      <div className="p-6 md:p-8 max-w-5xl mx-auto bg-slate-50 min-h-screen text-slate-900 space-y-8 relative">
        
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
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={() => setIsComplianceModalOpen(true)}
              className="bg-white hover:bg-slate-100 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
              Add Compliance
            </button>
            <button className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">report</span>
              Report Issue
            </button>
          </div>
        </div>

        {/* Action Required Banner */}
        {unreadCount > 0 && (
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl p-6 shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
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
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                My Vehicle Status
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined text-[24px]">directions_car</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">Active Assignment</p>
                  <p className="text-sm font-bold text-slate-900">Assigned Vehicles</p>
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
                className="w-full bg-blue-600 text-white font-bold text-xs py-3 rounded-xl shadow-sm hover:shadow-md hover:bg-blue-700 transition-all cursor-pointer"
              >
                Contact Manager
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL: Contact Manager --- */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">mail</span>
                Message Fleet Manager
              </h3>
              <button onClick={() => setIsContactModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
              {contactStatus.msg && (
                <div className={`p-3 rounded-xl text-sm font-medium ${contactStatus.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                  {contactStatus.msg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <select 
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  <option>General Query</option>
                  <option>Vehicle Breakdown</option>
                  <option>Maintenance Request</option>
                  <option>Compliance Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Details</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe your issue or request..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsContactModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={contactLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {contactLoading ? 'Sending...' : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span> Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Add Compliance Document --- */}
      {isComplianceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">verified</span>
                Add Compliance Document
              </h3>
              <button onClick={() => setIsComplianceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleComplianceSubmit} className="p-6 space-y-4">
              {compStatus.msg && (
                <div className={`p-3 rounded-xl text-sm font-medium ${compStatus.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                  {compStatus.msg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Vehicle</label>
                <select 
                  required
                  value={compVehicleId}
                  onChange={(e) => setCompVehicleId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                >
                  <option value="" disabled>-- Select Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number} ({v.model})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                  <select 
                    value={compType}
                    onChange={(e) => setCompType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  >
                    <option>Insurance</option>
                    <option>Inspection</option>
                    <option>PUC</option>
                    <option>Fitness Certificate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input 
                    required
                    type="date"
                    value={compExpiry}
                    onChange={(e) => setCompExpiry(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload File (PDF/Image)</label>
                <input 
                  required
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setCompFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full border border-dashed border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:border-emerald-400 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsComplianceModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={compLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {compLoading ? 'Uploading...' : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">upload</span> Upload Doc
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}