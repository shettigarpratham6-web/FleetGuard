'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { api } from '@/services/api';
import { Vehicle, User, ServiceRecord } from '@/types';
import { Wrench, Calendar, FileText, CheckCircle, Clock } from 'lucide-react';

import ServiceFilters from '@/components/service/ServiceFilters';
import ServiceQueueTable from '@/components/service/ServiceQueueTable';
import CompleteServiceModal from '@/components/service/CompleteServiceModal';
import AddHistoricalRecordModal from '@/components/service/AddHistoricalRecordModal';

export default function MechanicDashboardPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyServiced, setRecentlyServiced] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isHistoricalPopupOpen, setIsHistoricalPopupOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    service_date: new Date().toISOString().split('T')[0],
    current_mileage: '',
    service_type: 'General Maintenance',
    mechanic_name: '',
    service_center_name: '',
    problems_found: '',
    parts_replaced: '',
    work_performed: '',
    total_cost: '',
    next_service_date: '',
    next_service_km: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = api.auth.getLocalUser();
    if (!['Service Center', 'Admin', 'Fleet Manager', 'Manager'].includes(currentUser?.role || '')) {
      router.push('/driver');
      return;
    }

    // Auto-fill some data if available
    setFormData(prev => ({
      ...prev,
      mechanic_name: currentUser?.full_name || '',
      service_center_name: 'FleetGuard Service Center'
    }));

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, usersData, assignmentsData] = await Promise.all([
        api.vehicles.getAll(),
        api.auth.getUsers(),
        api.assignments?.getAll?.() || Promise.resolve([]),
      ]);
      setVehicles(vehiclesData || []);
      setUsers(usersData || []);
      setAssignments(assignmentsData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const search = searchQuery.toLowerCase();
    const assignment = assignments.find(a => a.vehicle_id === v.id && a.status === 'Active');
    const driver = users.find(u => u.id === assignment?.driver_id);

    return (
      v.vehicle_number.toLowerCase().includes(search) ||
      (v.model && v.model.toLowerCase().includes(search)) ||
      (driver && driver.full_name.toLowerCase().includes(search))
    );
  });

  const handleOpenPopup = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData(prev => ({
      ...prev,
      current_mileage: vehicle.current_mileage?.toString() || '',
      service_date: new Date().toISOString().split('T')[0],
      problems_found: '',
      parts_replaced: '',
      work_performed: '',
      total_cost: '',
      next_service_date: '',
      notes: ''
    }));
    setError('');
    setRecentRecords([]);
    setFormData({
      service_date: new Date().toISOString().split('T')[0],
      current_mileage: vehicle.current_mileage?.toString() || '',
      service_type: '',
      work_performed: '',
      total_cost: '',
      service_center_name: '',
      mechanic_name: '',
      next_service_date: '',
      next_service_km: ''
    });
    setError('');
    setIsPopupOpen(true);

    try {
      // Fetch historical services for this vehicle
      const data = await api.historicalServices.getByVehicle(vehicle.id) as any;
      if (data && data.records) {
        setRecentRecords(data.records.slice(0, 4)); // Only show top 4 recent
      }
    } catch (err) {
      console.error('Failed to fetch recent records:', err);
    }
  };

  const handleOpenHistoricalPopup = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData(prev => ({
      ...prev,
      current_mileage: vehicle.current_mileage?.toString() || '',
      service_date: new Date().toISOString().split('T')[0],
      service_type: '',
      problems_found: '',
      parts_replaced: '',
      work_performed: '',
      total_cost: '',
      next_service_date: '',
      next_service_km: ''
    }));
    setError('');
    setIsHistoricalPopupOpen(true);
  };

  const handleStartService = async (vehicleId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/vehicles/${vehicleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({ status: 'Maintenance' })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    if (formData.next_service_km && Number(formData.next_service_km) < Number(formData.current_mileage)) {
      setError('Next Service KM must be greater than or equal to Odometer Reading.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const extraData = JSON.stringify({
        mechanic: formData.mechanic_name,
        center: formData.service_center_name,
        cost: formData.total_cost,
        work: formData.work_performed
      });

      await api.services.create({
        vehicle_id: selectedVehicle.id,
        service_date: formData.service_date,
        current_mileage: Number(formData.current_mileage),
        service_type: formData.service_type || 'General Maintenance',
        description: extraData,
        labour_cost: Number(formData.total_cost) || 0,
        parts_cost: 0,
        next_service_mileage: formData.next_service_km ? Number(formData.next_service_km) : undefined,
        next_service_date: formData.next_service_date || undefined
      });

      // Mark vehicle as available again
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api'}/vehicles/${selectedVehicle.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fleetguard_token')}`
        },
        body: JSON.stringify({ status: 'Available', current_mileage: Number(formData.current_mileage) })
      });

      // Mark it as recently serviced locally for UI feedback
      setRecentlyServiced(prev => [...prev, selectedVehicle.id]);

      setIsPopupOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit service record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHistoricalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setSubmitting(true);
    setError('');
    try {
      const extraData = JSON.stringify({
        mechanic: formData.mechanic_name,
        center: formData.service_center_name,
        cost: formData.total_cost,
        work: formData.work_performed,
        nextDate: formData.next_service_date,
        nextKm: formData.next_service_km
      });

      await api.historicalServices.create({
        vehicle_id: selectedVehicle.id,
        service_type: formData.service_type || 'General Service',
        service_date: formData.service_date,
        mileage: Number(formData.current_mileage),
        description: formData.service_type || 'General Service',
        remarks: extraData
      });
      setIsHistoricalPopupOpen(false);
      // Optional toast here
    } catch (err: any) {
      setError(err.message || 'Failed to submit historical record.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">
        
        <ServiceFilters 
          search={searchQuery} 
          onSearchChange={setSearchQuery} 
        />

        <ServiceQueueTable 
          filteredVehicles={filteredVehicles}
          assignments={assignments}
          users={users}
          recentlyServiced={recentlyServiced}
          handleStartService={handleStartService}
          handleOpenPopup={handleOpenPopup}
          handleOpenHistoricalPopup={handleOpenHistoricalPopup}
        />

        <CompleteServiceModal 
          isPopupOpen={isPopupOpen}
          setIsPopupOpen={setIsPopupOpen}
          selectedVehicle={selectedVehicle}
          recentRecords={recentRecords}
          error={error}
          handleSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          submitting={submitting}
        />

        <AddHistoricalRecordModal 
          isOpen={isHistoricalPopupOpen}
          setIsOpen={setIsHistoricalPopupOpen}
          selectedVehicle={selectedVehicle}
          error={error}
          handleSubmit={handleHistoricalSubmit}
          formData={formData}
          setFormData={setFormData}
          submitting={submitting}
        />

      </div>
    </LayoutWrapper>
  );
}
