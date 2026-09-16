/**
 * Checklist Model — column definitions for the checklists (pre-trip) table.
 */

const CHECKLIST_ITEMS = ['tyres_ok', 'brakes_ok', 'lights_ok', 'horn_ok', 'mirrors_ok'];
const CHECKLIST_STATUSES = ['Completed', 'Incomplete'];

const COLUMNS = [
  'id', 'vehicle_id', 'driver_id', 'checklist_date',
  'tyres_ok', 'brakes_ok', 'lights_ok', 'horn_ok', 'mirrors_ok',
  'remarks', 'status'
];

module.exports = {
  TABLE: 'checklists',
  CHECKLIST_ITEMS,
  CHECKLIST_STATUSES,
  COLUMNS
};
