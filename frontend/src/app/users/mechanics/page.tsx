'use client';
import React, { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const data = await api.auth.getUsers('Service Center');
        setMechanics(data || []);
      } catch (err) {
        console.error("Failed to fetch mechanics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMechanics();
  }, []);

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mechanics</h2>
          <p className="text-slate-500 text-sm mt-1">Manage service center personnel.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mechanics.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{user.full_name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">{user.phone_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs">Active</span>
                    </td>
                  </tr>
                ))}
                {mechanics.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500">No Mechanics registered.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
