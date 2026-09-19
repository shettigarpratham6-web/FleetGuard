/**
 * ServiceRecord Model — column definitions for the service_records table.
 */

export interface IServiceRecord {
  id?: string;
  vehicle_id: string;
  mechanic_id?: string;
  service_date: string;
  current_mileage: number;
  service_type: string;
  description?: string;
  parts_changed?: string;
  labour_cost?: number;
  parts_cost?: number;
  total_cost?: number;
  invoice_url?: string;
  next_service_mileage?: number;
  next_service_date?: string;
  created_at?: string;
  updated_at?: string;
}

export const TABLE = 'service_records';

export const COLUMNS: string[] = [
  'id', 'vehicle_id', 'mechanic_id', 'service_date', 'current_mileage',
  'service_type', 'description', 'parts_changed', 'labour_cost',
  'parts_cost', 'total_cost', 'invoice_url', 'next_service_mileage',
  'next_service_date', 'created_at', 'updated_at'
];

export const COMMON_SERVICE_TYPES: string[] = [
  'Routine Maintenance', 'Oil Change', 'Tyre Rotation', 'Brake Service',
  'Engine Tune-up', 'Transmission Service', 'Air Filter Replacement',
  'Battery Replacement', 'Coolant Flush', 'Wheel Alignment', 'Other'
];

export default {
  TABLE,
  COLUMNS,
  COMMON_SERVICE_TYPES
};
