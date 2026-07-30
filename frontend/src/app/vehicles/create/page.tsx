'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle } from '@/types';

export default function CreateVehiclePage() {
  const router = useRouter();
  
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    vehicle_number: '',
    registration_number: '',
    vehicle_type: 'Heavy Truck',
    manufacturer: '',
    model: '',
    manufacturing_year: new Date().getFullYear(),
    fuel_type: 'Diesel',
    current_mileage: 0,
    purchase_date: '',
    branch_id: '',
    status: 'Available'
  });

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = api.auth.getLocalUser();
    if (!currentUser || !['Admin', 'Fleet Manager'].includes(currentUser.role)) {
      router.push('/dashboard');
      return;
    }

    const loadBranches = async () => {
      try {
        setFetchingBranches(true);
        const data = await api.branches.getAll();
        setBranches(data || []);
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, branch_id: data[0].id }));
        }
      } catch (err: any) {
        setError('Failed to load branches for selection.');
      } finally {
        setFetchingBranches(false);
      }
    };
    loadBranches();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.vehicles.create(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create vehicle');
      setLoading(false);
    }
  };

  if (fetchingBranches) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-semibold text-sm text-slate-600">Loading form...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto bg-slate-50 min-h-screen text-slate-900">
        <div className="pb-4 border-b border-slate-200">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Add New Vehicle
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Register a new fleet asset into the system.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Internal Vehicle Number (e.g. TX-1001) *
              </label>
              <input
                type="text"
                name="vehicle_number"
                value={formData.vehicle_number}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Unique fleet identifier"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                License/Registration Plate *
              </label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="State registration number"
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Vehicle Type *
              </label>
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="Heavy Truck">Heavy Truck</option>
                <option value="Light Van">Light Van</option>
                <option value="Car">Car</option>
                <option value="Bus">Bus</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Manufacturer *
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="e.g. Ford, Volvo"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="e.g. F-150, VNL 860"
              />
            </div>

            {/* Manufacturing Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Manufacturing Year
              </label>
              <input
                type="number"
                name="manufacturing_year"
                value={formData.manufacturing_year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Fuel Type
              </label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            {/* Current Mileage */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Current Mileage (mi)
              </label>
              <input
                type="number"
                name="current_mileage"
                value={formData.current_mileage}
                onChange={handleChange}
                min="0"
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Purchase Date
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Operating Branch *
              </label>
              <select
                name="branch_id"
                value={formData.branch_id}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="" disabled>Select Branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.branch_name} - {b.city}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Initial Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              Register Vehicle
            </button>
          </div>
        </form>
      </div>
    </LayoutWrapper>
  );
}
