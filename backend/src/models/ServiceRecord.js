/**
 * ServiceRecord Model — column definitions for the service_records table.
 */

const COLUMNS = [
  'id', 'vehicle_id', 'mechanic_id', 'service_date', 'current_mileage',
  'service_type', 'description', 'parts_changed', 'labour_cost',
  'parts_cost', 'total_cost', 'invoice_url', 'next_service_mileage',
  'next_service_date', 'created_at', 'updated_at'
];

const COMMON_SERVICE_TYPES = [
  'Routine Maintenance', 'Oil Change', 'Tyre Rotation', 'Brake Service',
  'Engine Tune-up', 'Transmission Service', 'Air Filter Replacement',
  'Battery Replacement', 'Coolant Flush', 'Wheel Alignment', 'Other'
];

module.exports = {
  TABLE: 'service_records',
  COLUMNS,
  COMMON_SERVICE_TYPES
};
