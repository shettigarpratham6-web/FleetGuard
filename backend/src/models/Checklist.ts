/**
 * Checklist Model — column definitions for the checklists (pre-trip) table.
 */

export interface IChecklist {
  id?: string;
  vehicle_id: string;
  driver_id: string;
  checklist_date: string;
  tyres_ok: boolean;
  brakes_ok: boolean;
  lights_ok: boolean;
  horn_ok: boolean;
  mirrors_ok: boolean;
  remarks?: string;
  status: 'Completed' | 'Incomplete';
}

export const TABLE = 'checklists';

export const CHECKLIST_ITEMS: string[] = ['tyres_ok', 'brakes_ok', 'lights_ok', 'horn_ok', 'mirrors_ok'];

export const CHECKLIST_STATUSES: ('Completed' | 'Incomplete')[] = ['Completed', 'Incomplete'];

export const COLUMNS: string[] = [
  'id', 'vehicle_id', 'driver_id', 'checklist_date',
  'tyres_ok', 'brakes_ok', 'lights_ok', 'horn_ok', 'mirrors_ok',
  'remarks', 'status'
];

export default {
  TABLE,
  CHECKLIST_ITEMS,
  CHECKLIST_STATUSES,
  COLUMNS
};
