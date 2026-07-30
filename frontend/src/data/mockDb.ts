import { User, Vehicle, ServiceRecord, MaintenanceRisk, HistoricalService, ComplianceDocument } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'u1',
    username: 'sarah_j',
    full_name: 'Sarah J.',
    email: 'sarah.jenkins@fleetguard.com',
    role: 'Fleet Manager',
    profile_picture: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyNWRLx_E1OWgPi7aT-s7keymJamS_sAULSOKC77sBamBVVEH8asmCa3f4NYOaE3mG3geTNRGrCEk9EHHGtRbopLaZ52J0biD4pjdRExkF4tELoYtoq-zasE6so0CeaGSIAvvheeL2qrq5EGlYXYnXy2LFAAHWpIX7MRS7rUU0FgN3ulrekGF7ncrztv17tLcE_3HUrNuSMCnC1wGiBZ6Az6Q7ajamDg6nZkmfN3G0rW9Vloo_heFU',
    status: 'Active',
  },
  {
    id: 'u2',
    username: 'sarah_lead',
    full_name: 'Sarah Jenkins',
    email: 'sarah.tech@fleetguard.com',
    role: 'Service Center',
    status: 'Active',
  },
  {
    id: 'u3',
    username: 'mike_ross',
    full_name: 'Mike Ross',
    email: 'mike.ross@fleetguard.com',
    role: 'Service Center',
    status: 'Active',
  },
  {
    id: 'u4',
    username: 'vendor_autofix',
    full_name: 'External Vendor (AutoFix Inc)',
    email: 'contact@autofix.com',
    role: 'Service Center',
    status: 'Active',
  }
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    vehicle_number: 'TX-8492',
    registration_number: 'REG-TX8492',
    vehicle_type: 'Heavy Truck',
    manufacturer: 'Volvo',
    model: 'VNL 860',
    manufacturing_year: 2021,
    fuel_type: 'Diesel',
    current_mileage: 342850,
    branch_id: 'b1',
    status: 'Maintenance'
  },
  {
    id: 'v2',
    vehicle_number: 'NY-1104',
    registration_number: 'REG-NY1104',
    vehicle_type: 'Heavy Truck',
    manufacturer: 'Freightliner',
    model: 'Cascadia',
    manufacturing_year: 2020,
    fuel_type: 'Diesel',
    current_mileage: 185200,
    branch_id: 'b1',
    status: 'Maintenance'
  },
  {
    id: 'v3',
    vehicle_number: 'CA-5521',
    registration_number: 'REG-CA5521',
    vehicle_type: 'Heavy Truck',
    manufacturer: 'Kenworth',
    model: 'T680',
    manufacturing_year: 2019,
    fuel_type: 'Diesel',
    current_mileage: 412050,
    branch_id: 'b2',
    status: 'Assigned'
  },
  {
    id: 'v4',
    vehicle_number: 'WA-9920',
    registration_number: 'REG-WA9920',
    vehicle_type: 'Heavy Truck',
    manufacturer: 'Peterbilt',
    model: '579',
    manufacturing_year: 2022,
    fuel_type: 'Diesel',
    current_mileage: 89100,
    branch_id: 'b1',
    status: 'Available'
  },
  {
    id: 'v5',
    vehicle_number: 'TRK-4092',
    registration_number: 'REG-TRK4092',
    vehicle_type: 'Heavy Truck',
    manufacturer: 'Volvo',
    model: 'FH16',
    manufacturing_year: 2022,
    fuel_type: 'Diesel',
    current_mileage: 124500,
    branch_id: 'b1',
    status: 'Available'
  },
  {
    id: 'v6',
    vehicle_number: 'VAN-1104',
    registration_number: 'REG-VAN1104',
    vehicle_type: 'Light Van',
    manufacturer: 'Mercedes',
    model: 'Sprinter',
    manufacturing_year: 2021,
    fuel_type: 'Diesel',
    current_mileage: 65200,
    branch_id: 'b3',
    status: 'Available'
  },
  {
    id: 'v7',
    vehicle_number: 'TRK-2210',
    registration_number: 'REG-TRK2210',
    vehicle_type: 'Heavy Truck',
    manufacturer: 'Scania',
    model: 'R450',
    manufacturing_year: 2020,
    fuel_type: 'Diesel',
    current_mileage: 215400,
    branch_id: 'b1',
    status: 'Maintenance'
  }
];

// Mock Maintenance Risks
export const mockMaintenanceRisks: MaintenanceRisk[] = [
  {
    id: 'mr1',
    vehicle_id: 'v1', // TX-8492
    current_mileage: 342850,
    last_service_mileage: 331600,
    recommended_interval: 10000,
    remaining_distance: -1250,
    risk_level: 'High',
    summary: 'Distance exceeded by 1,250 miles. Required: Full Synthetic Oil Change & Filter.',
    last_updated: '2023-10-25T08:00:00Z'
  },
  {
    id: 'mr2',
    vehicle_id: 'v2', // NY-1104
    current_mileage: 185200,
    last_service_mileage: 169400,
    recommended_interval: 15000,
    remaining_distance: -800,
    risk_level: 'High',
    summary: 'Distance exceeded by 800 miles. Required: Tire Rotation & Alignment.',
    last_updated: '2023-10-25T08:00:00Z'
  },
  {
    id: 'mr3',
    vehicle_id: 'v3', // CA-5521
    current_mileage: 412050,
    last_service_mileage: 396600,
    recommended_interval: 15900,
    remaining_distance: 450,
    risk_level: 'Medium',
    summary: '450 miles remaining before steer brake pad replacement. Maintenance imminent.',
    last_updated: '2023-10-25T08:00:00Z'
  },
  {
    id: 'mr4',
    vehicle_id: 'v4', // WA-9920
    current_mileage: 89100,
    last_service_mileage: 75000,
    recommended_interval: 20000,
    remaining_distance: 5900,
    risk_level: 'Low',
    summary: '5,900 miles remaining before scheduled HVAC System Inspection.',
    last_updated: '2023-10-25T08:00:00Z'
  }
];

// Mock Service Records
export let mockServiceRecords: ServiceRecord[] = [
  {
    id: 'sr1',
    vehicle_id: 'v5', // TRK-4092
    mechanic_id: 'u2', // Sarah Jenkins
    service_date: '2023-10-24',
    current_mileage: 124500,
    service_type: 'Brake Replacement',
    description: 'Replaced front brake pads and rotors. Bled brake lines. Caliper seals inspected and found healthy.',
    parts_changed: 'Front Brake Pads (BP-902), Front Brake Rotors (BR-448), DOT 4 Brake Fluid',
    labour_cost: 450.00,
    parts_cost: 800.00,
    total_cost: 1250.00,
    invoice_url: '/invoices/sr1.pdf',
    next_service_mileage: 154500,
    next_service_date: '2024-04-24'
  },
  {
    id: 'sr2',
    vehicle_id: 'v6', // VAN-1104
    mechanic_id: 'u3', // Mike Ross
    service_date: '2023-10-23',
    current_mileage: 65200,
    service_type: 'Oil Change & Filter',
    description: 'Full synthetic oil change and filter replacement. Topped off coolant and windshield washer fluid. Multi-point inspection completed.',
    parts_changed: 'Synthetic Engine Oil 5W-30 (5L), Oil Filter (OF-192)',
    labour_cost: 45.00,
    parts_cost: 40.50,
    total_cost: 85.50,
    invoice_url: '/invoices/sr2.pdf',
    next_service_mileage: 75200,
    next_service_date: '2024-04-23'
  },
  {
    id: 'sr3',
    vehicle_id: 'v7', // TRK-2210
    mechanic_id: 'u4', // External Vendor
    service_date: '2023-10-23',
    current_mileage: 215400,
    service_type: 'Transmission Diag.',
    description: 'Investigating rough shifting in lower gears. Diagnostics running on TCM.',
    labour_cost: 150.00,
    parts_cost: 0.00,
    total_cost: 150.00,
    next_service_date: '2023-11-23'
  }
];

// Mock Historical Services
export const mockHistoricalServices: HistoricalService[] = [
  {
    id: 'h1',
    vehicle_id: 'v1',
    service_date: '2023-05-12',
    mileage: 320000,
    description: 'Scheduled DPF Cleaning and EGR Valve inspection.',
    entered_by: 'u1',
    remarks: 'DPF backpressure resolved. System cleared.'
  },
  {
    id: 'h2',
    vehicle_id: 'v1',
    service_date: '2023-01-14',
    mileage: 295000,
    description: 'Transmission Fluid flush and filter replacement.',
    entered_by: 'u1',
    remarks: 'Fluid was slightly burnt, recommends next flush in 40,000 miles.'
  },
  {
    id: 'h3',
    vehicle_id: 'v2',
    service_date: '2023-06-18',
    mileage: 165000,
    description: 'Water pump replacement and coolant system refresh.',
    entered_by: 'u1',
    remarks: 'Replaced under extended warranty. Thermostat checked.'
  }
];

// Mock Compliance Documents
export const mockComplianceDocuments: ComplianceDocument[] = [
  {
    id: 'cd1',
    vehicle_id: 'v1',
    document_type: 'Insurance',
    document_number: 'INS-VOL-90823',
    issue_date: '2023-01-01',
    expiry_date: '2024-01-01',
    status: 'Valid',
    uploaded_by: 'u1'
  },
  {
    id: 'cd2',
    vehicle_id: 'v1',
    document_type: 'Inspection',
    document_number: 'MOT-TX-2023',
    issue_date: '2023-06-15',
    expiry_date: '2024-06-15',
    status: 'Valid',
    uploaded_by: 'u1'
  },
  {
    id: 'cd3',
    vehicle_id: 'v1',
    document_type: 'PUC',
    document_number: 'PUC-8492-A',
    issue_date: '2023-07-01',
    expiry_date: '2023-10-01', // Expired
    status: 'Expired',
    uploaded_by: 'u1'
  }
];

// In-Memory Database Actions
export const db = {
  getVehicles: () => mockVehicles,
  getVehicle: (id: string) => mockVehicles.find(v => v.id === id || v.vehicle_number === id),
  getUsers: () => mockUsers,
  getServiceRecords: () => mockServiceRecords,
  getServiceRecord: (id: string) => mockServiceRecords.find(sr => sr.id === id),
  getHistoricalServices: (vehicleId?: string) => 
    vehicleId ? mockHistoricalServices.filter(h => h.vehicle_id === vehicleId) : mockHistoricalServices,
  getMaintenanceRisks: () => mockMaintenanceRisks,
  getComplianceDocuments: (vehicleId: string) => mockComplianceDocuments.filter(cd => cd.vehicle_id === vehicleId),
  
  createServiceRecord: (record: Omit<ServiceRecord, 'id' | 'total_cost'>) => {
    const newRecord: ServiceRecord = {
      ...record,
      id: `sr${mockServiceRecords.length + 1}`,
      total_cost: Number(record.labour_cost) + Number(record.parts_cost)
    };
    mockServiceRecords = [newRecord, ...mockServiceRecords];
    
    // Also update vehicle mileage if this mileage is higher
    const vehicle = mockVehicles.find(v => v.id === record.vehicle_id);
    if (vehicle && record.current_mileage > vehicle.current_mileage) {
      vehicle.current_mileage = record.current_mileage;
    }
    
    return newRecord;
  }
};
