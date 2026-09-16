'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { Vehicle, ComplianceDocument, Notification, Checklist } from '@/types';

export default function DriverDashboard() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [complianceDocs, setComplianceDocs] = useState<ComplianceDocument[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [checklistCompleted, setChecklistCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingChecklist, setSubmittingChecklist] = useState(false);

  // Pre-trip checklist state
  const [checklistItems, setChecklistItems] = useState({
    tyres: false,
    brakes: false,
    lights: false,
    mirrors: false,
    horn: false,
  });

  useEffect(() => {
    const loadDriverData = async () => {
      try {
        setLoading(true);
        const currentUser = api.auth.getLocalUser();
        if (!currentUser) return;

        const [assignments, allVehicles, notifs, checklists] = await Promise.all([
          api.assignments.getAll(),
          api.vehicles.getAll(),
          api.notifications.getMyNotifications(),
          api.checklists.getMyChecklists(),
        ]);

        // Find driver's active assignment
        const myAssignment = (assignments || []).find(
          (a) => a.driver_id === currentUser.id && a.status === 'Active'
        );

        if (myAssignment) {
          const myVeh = (allVehicles || []).find((v) => v.id === myAssignment.vehicle_id);
          if (myVeh) {
            setVehicle(myVeh);
            const vehDetails = await api.vehicles.getById(myVeh.id);
            setComplianceDocs(vehDetails.compliance_documents || []);
          }
        }

        setNotifications(notifs || []);

        // Check if today's checklist is submitted
        const todayStr = new Date().toISOString().split('T')[0];
        const hasToday = (checklists || []).some(
          (c) => c.created_at && c.created_at.startsWith(todayStr)
        );
        setChecklistCompleted(hasToday);
      } catch (err) {
        console.error('Failed to load driver dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDriverData();
  }, []);

  const handleChecklistChange = (key: keyof typeof checklistItems) => {
    setChecklistItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChecklistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = api.auth.getLocalUser();
    if (!currentUser || !vehicle) return;

    const allChecked = Object.values(checklistItems).every(Boolean);

    setSubmittingChecklist(true);
    try {
      await api.checklists.create({
        driver_id: currentUser.id,
        vehicle_id: vehicle.id,
        odometer_reading: vehicle.current_mileage || 0,
        brakes_status: checklistItems.brakes ? 'Pass' : 'Fail',
        tires_status: checklistItems.tyres ? 'Pass' : 'Fail',
        lights_status: checklistItems.lights ? 'Pass' : 'Fail',
        fluids_status: checklistItems.mirrors && checklistItems.horn ? 'Pass' : 'Attention',
        overall_status: allChecked ? 'Passed' : 'Attention Required',
        notes: `Mirrors: ${checklistItems.mirrors ? 'Pass' : 'Fail'}, Horn: ${
          checklistItems.horn ? 'Pass' : 'Fail'
        }`,
      });
      setChecklistCompleted(true);
    } catch (err) {
      console.error('Failed to submit checklist:', err);
    } finally {
      setSubmittingChecklist(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="font-semibold text-sm text-slate-600">Loading Driver Dashboard...</p>
      </div>
    );
  }

  // Calculate compliance status
  const insuranceDoc = complianceDocs.find((d) => d.document_type === 'Insurance');
  const inspectionDoc = complianceDocs.find((d) => d.document_type === 'Inspection');
  const pucDoc = complianceDocs.find((d) => d.document_type === 'PUC');

  const isExpired = (doc?: ComplianceDocument) => {
    if (!doc || !doc.expiry_date) return false;
    return new Date(doc.expiry_date).getTime() < Date.now();
  };

  const isNonCompliant =
    isExpired(insuranceDoc) || isExpired(inspectionDoc) || isExpired(pucDoc);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 block mb-1">
          Driver Portal
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Driver Dashboard
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Operate assigned vehicle safely and perform daily inspections
        </p>
      </div>

      {/* Assigned Vehicle & Road Legal Status */}
      {vehicle ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              My Assigned Vehicle
            </span>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[32px]">directions_car</span>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  {vehicle.vehicle_number}
                </h3>
                <p className="text-sm font-medium text-slate-600">
                  {vehicle.manufacturer} {vehicle.model} • {vehicle.registration_number}
                </p>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Mileage: {vehicle.current_mileage?.toLocaleString() || 0} mi
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl p-6 shadow-sm border flex flex-col justify-between ${
              isNonCompliant
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block mb-1">
                Vehicle Compliance Status
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`material-symbols-outlined text-[28px] ${
                    isNonCompliant ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {isNonCompliant ? 'cancel' : 'check_circle'}
                </span>
                <span className="text-xl font-black">
                  {isNonCompliant ? 'Do Not Drive' : 'Road Legal'}
                </span>
              </div>
            </div>
            <div className="text-xs space-y-1 mt-4 pt-3 border-t border-black/10">
              <div className="flex justify-between">
                <span>Insurance:</span>
                <span className="font-bold">
                  {isExpired(insuranceDoc) ? 'Expired' : 'Valid'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Inspection:</span>
                <span className="font-bold">
                  {isExpired(inspectionDoc) ? 'Expired' : 'Valid'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pollution (PUC):</span>
                <span className="font-bold">
                  {isExpired(pucDoc) ? 'Expired' : 'Valid'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
          <span className="material-symbols-outlined text-[36px] block mb-2 text-amber-600">
            no_crash
          </span>
          <h3 className="font-bold text-base">No Assigned Vehicle</h3>
          <p className="text-xs mt-1 text-amber-700">
            You currently do not have an active vehicle assigned to you. Contact your fleet manager.
          </p>
        </div>
      )}

      {/* Pre-Trip Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">Daily Pre-Trip Checklist</h3>
        <p className="text-xs text-slate-500 mb-4">
          Verify safety points before starting your trip.
        </p>

        {checklistCompleted ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-[24px]">
              task_alt
            </span>
            <div>
              <p className="font-bold text-sm">Today's checklist completed.</p>
              <p className="text-xs text-emerald-700">Have a safe journey on the road!</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChecklistSubmit} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'tyres', label: 'Tyres' },
                { id: 'brakes', label: 'Brakes' },
                { id: 'lights', label: 'Lights' },
                { id: 'mirrors', label: 'Mirrors' },
                { id: 'horn', label: 'Horn' },
              ].map((item) => {
                const key = item.id as keyof typeof checklistItems;
                const checked = checklistItems[key];
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleChecklistChange(key)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="text-xs">{item.label}</span>
                  </label>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={!vehicle || submittingChecklist}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submittingChecklist ? (
                'Submitting...'
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Submit Pre-Trip Checklist
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Notifications Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-3">Notifications & Alerts</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-1"
              >
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{n.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-600">{n.message}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No notifications.</p>
          )}
        </div>
      </div>
    </div>
  );
}
