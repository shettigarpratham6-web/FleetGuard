/**
 * Vehicle Model — column definitions and constants for the vehicles table.
 */

const VEHICLE_STATUSES = ['Available', 'Assigned', 'Maintenance', 'Inactive'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Bus', 'Motorcycle', 'Other'];

const COLUMNS = [
  'id', 'vehicle_number', 'registration_number', 'vehicle_type',
  'manufacturer', 'model', 'manufacturing_year', 'fuel_type',
  'current_mileage', 'purchase_date', 'branch_id', 'status',
  'created_at', 'updated_at'
];

module.exports = {
  TABLE: 'vehicles',
  VEHICLE_STATUSES,
  FUEL_TYPES,
  VEHICLE_TYPES,
  COLUMNS
};
