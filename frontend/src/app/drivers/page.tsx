'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { User, Vehicle } from '@/types';

export default function DriversPage() {
  const router = useRouter();
  const [activeDrivers, setActiveDrivers] = useState<User[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = api.auth.getLocalUser();
    if (user?.role !== 'Fleet Manager' && user?.role !== 'Admin' && user?.role !== 'Manager') {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allUsers, allAssignments, allVehicles] = await Promise.all([
        api.auth.getUsers('Driver'),
        api.assignments?.getAll?.() || Promise.resolve([]),
        api.vehicles.getAll()
      ]);
      
      setActiveDrivers(allUsers.filter(u => u.status === 'Active'));
      setPendingDrivers(allUsers.filter(u => u.status === 'Pending'));
      setAssignments(allAssignments || []);
      setVehicles(allVehicles || []);
    } catch (err) {
      console.error('Failed to load driver data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (driverId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/auth/users/${driverId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({ status: 'Active' })
      });
      fetchData();
    } catch (err) {
      console.error('Error approving driver', err);
    }
  };

  const handleReject = async (driverId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/auth/users/${driverId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({ status: 'Rejected' })
      });
      fetchData();
    } catch (err) {
      console.error('Error rejecting driver', err);
    }
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Driver Management
          </h2>
        </div>

        {/* Pending Drivers Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 text-lg">Pending Drivers</h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold rounded-full text-xs">
              {pendingDrivers.length} Pending
            </span>
          </div>
          
          {pendingDrivers.length === 0 ? (
            <p className="text-slate-500 text-sm">No pending driver registrations.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingDrivers.map(driver => (
                <div key={driver.id} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{driver.full_name}</h4>
                    <p className="text-sm text-slate-500">Phone: {driver.phone || 'N/A'}</p>
                    <p className="text-sm text-slate-500">License: {driver.license_number || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleApprove(driver.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(driver.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-2 rounded-lg text-sm transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Driver List Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-lg">Driver List</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs">
              {activeDrivers.length} Active
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-3">Driver Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Assigned Vehicle</th>
                  <th className="px-6 py-3">Assignment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDrivers.map(driver => {
                  const assignment = assignments.find(a => a.driver_id === driver.id && a.status === 'Active');
                  const assignedVehicle = vehicle => vehicle.id === assignment?.vehicle_id;
                  const v = vehicles.find(assignedVehicle);
                  return (
                    <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{driver.full_name}</td>
                      <td className="px-6 py-4">{driver.phone || 'N/A'}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{v ? v.vehicle_number : <span className="text-slate-400">None</span>}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${assignment ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {assignment ? 'Assigned' : 'Available'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {activeDrivers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No active drivers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </LayoutWrapper>
  );
}
