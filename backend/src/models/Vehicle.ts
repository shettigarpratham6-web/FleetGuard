/**
 * Vehicle Model — column definitions and constants for the vehicles table.
 */

export interface IVehicle {
  id?: string;
  vehicle_number: string;
  registration_number: string;
  vehicle_type: 'Sedan' | 'SUV' | 'Truck' | 'Van' | 'Bus' | 'Motorcycle' | 'Other';
  manufacturer?: string;
  model?: string;
  manufacturing_year?: number;
  fuel_type: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'CNG' | 'LPG';
  current_mileage: number;
  purchase_date?: string;
  branch_id?: string;
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export const TABLE = 'vehicles';

export const VEHICLE_STATUSES: ('Available' | 'Assigned' | 'Maintenance' | 'Inactive')[] = [
  'Available', 'Assigned', 'Maintenance', 'Inactive'
];

export const FUEL_TYPES: ('Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'CNG' | 'LPG')[] = [
  'Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'
];

export const VEHICLE_TYPES: ('Sedan' | 'SUV' | 'Truck' | 'Van' | 'Bus' | 'Motorcycle' | 'Other')[] = [
  'Sedan', 'SUV', 'Truck', 'Van', 'Bus', 'Motorcycle', 'Other'
];

export const COLUMNS: string[] = [
  'id', 'vehicle_number', 'registration_number', 'vehicle_type',
  'manufacturer', 'model', 'manufacturing_year', 'fuel_type',
  'current_mileage', 'purchase_date', 'branch_id', 'status',
  'created_at', 'updated_at'
];

export default {
  TABLE,
  VEHICLE_STATUSES,
  FUEL_TYPES,
  VEHICLE_TYPES,
  COLUMNS
};
