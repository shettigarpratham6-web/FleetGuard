
export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: 'Admin' | 'Fleet Manager' | 'Driver' | 'Service Center' | 'Manager' | 'User';
  profile_picture?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Rejected';
  firebase_uid?: string;
  created_at?: string;
  branch_id?: string;
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  registration_number: string;
  vehicle_type: string;
  manufacturer: string;
  model: string;
  manufacturing_year?: number;
  fuel_type?: string;
  current_mileage: number;
  purchase_date?: string;
  branch_id: string;
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Inactive';
}

export interface ServiceRecord {
  id: string;
  vehicle_id: string;
  mechanic_id: string;
  service_date: string;
  current_mileage: number;
  service_type: string;
  description?: string;
  parts_changed?: string; // JSON or text details of parts
  labour_cost: number;
  parts_cost: number;
  total_cost: number;
  invoice_url?: string;
  next_service_mileage?: number;
  next_service_date?: string;
}

export interface HistoricalService {
  id: string;
  vehicle_id: string;
  service_date: string;
  mileage: number;
  description: string;
  entered_by: string;
  remarks?: string;
}

export interface MaintenanceRisk {
  id: string;
  vehicle_id: string;
  current_mileage: number;
  last_service_mileage: number;
  recommended_interval: number;
  remaining_distance: number;
  risk_level: 'Low' | 'Medium' | 'High';
  summary?: string;
  last_updated: string;
}

export interface ComplianceDocument {
  id: string;
  vehicle_id: string;
  document_type: 'Insurance' | 'Inspection' | 'PUC' | 'Fitness Certificate';
  document_number?: string;
  issue_date?: string;
  expiry_date: string;
  file_url?: string;
  status: 'Valid' | 'Expired' | 'Pending';
  uploaded_by?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  vehicle_id?: string;
  title: string;
  message: string;
  notification_type?: string;
  is_read: boolean;
  created_at: string;
  vehicle_number?: string;
  registration_number?: string;
}
