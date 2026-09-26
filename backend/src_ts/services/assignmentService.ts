import db from '../config/db';

export const getActiveAssignmentForVehicle = async (vehicleId: string): Promise<any | null> => {
  const result = await db.query(
    "SELECT * FROM assignments WHERE vehicle_id = $1 AND assignment_status = 'Active' LIMIT 1",
    [vehicleId]
  );
  return result.rows[0] || null;
};

export const getActiveAssignmentForDriver = async (driverId: string): Promise<any | null> => {
  const result = await db.query(
    "SELECT * FROM assignments WHERE driver_id = $1 AND assignment_status = 'Active' LIMIT 1",
    [driverId]
  );
  return result.rows[0] || null;
};

export const closeActiveAssignment = async (vehicleId: string): Promise<void> => {
  await db.query(
    "UPDATE assignments SET assignment_status = 'Completed', return_date = NOW() WHERE vehicle_id = $1 AND assignment_status = 'Active'",
    [vehicleId]
  );
};

export const getAssignmentHistory = async (vehicleId: string): Promise<any[]> => {
  const result = await db.query(
    `SELECT a.*,
            u.full_name AS driver_name, u.email AS driver_email,
            m.full_name AS assigned_by_name
     FROM assignments a
     JOIN users u ON a.driver_id = u.id
     JOIN users m ON a.assigned_by = m.id
     WHERE a.vehicle_id = $1
     ORDER BY COALESCE(a.assigned_date, a.created_at, NOW()) DESC`,
    [vehicleId]
  );
  return result.rows;
};

export default {
  getActiveAssignmentForVehicle,
  getActiveAssignmentForDriver,
  closeActiveAssignment,
  getAssignmentHistory
};
