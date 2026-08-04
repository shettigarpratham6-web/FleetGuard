'use client';
import React, { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const usersList = await api.auth.getUsers();
        setUsers(usersList || []);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllUsers();
  }, []);

  const getRoleBadgeColor = (role: string) => {
    if (role === 'Admin') return 'bg-purple-100 text-purple-700';
    if (role === 'Fleet Manager') return 'bg-blue-100 text-blue-700';
    if (role === 'Driver') return 'bg-emerald-100 text-emerald-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h2>
            <p className="text-slate-500 text-sm mt-1">Global directory of all registered personnel.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span> Add User
          </button>
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
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{user.full_name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-blue-600 font-bold hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
