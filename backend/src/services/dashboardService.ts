/**
 * Dashboard Service — aggregate data for the dashboard summary endpoint.
 */
import db from '../config/db';

export interface DashboardSummary {
  vehicles: {
    total: number;
    available: number;
    in_maintenance: number;
    assigned: number;
  };
  compliance: {
    expired_documents: number;
    expiring_within_30_days: number;
  };
  maintenance: {
    high_risk_vehicles: number;
  };
  branches: {
    total: number;
  };
  drivers: {
    total: number;
  };
  checklists: {
    submitted_today: number;
  };
}

/**
 * Get full dashboard summary metrics.
 */
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const [
    vehicleCount,
    activeAssignments,
    maintenanceCount,
    availableCount,
    expiredDocs,
    expiringDocs,
    highRiskVehicles,
    totalBranches,
    totalDrivers,
    checklistsToday
  ] = await Promise.all([
    db.query('SELECT COUNT(*) FROM vehicles'),
    db.query("SELECT COUNT(*) FROM assignments WHERE assignment_status = 'Active'"),
    db.query("SELECT COUNT(*) FROM vehicles WHERE status = 'Maintenance'"),
    db.query("SELECT COUNT(*) FROM vehicles WHERE status = 'Available'"),
    db.query('SELECT COUNT(*) FROM compliance_documents WHERE expiry_date < CURRENT_DATE'),
    db.query('SELECT COUNT(*) FROM compliance_documents WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30'),
    db.query("SELECT COUNT(*) FROM maintenance_risks WHERE risk_level = 'High'"),
    db.query('SELECT COUNT(*) FROM branches'),
    db.query("SELECT COUNT(*) FROM users WHERE role = 'Driver'"),
    db.query('SELECT COUNT(*) FROM checklists WHERE checklist_date = CURRENT_DATE')
  ]);

  return {
    vehicles: {
      total: parseInt(vehicleCount.rows[0].count, 10),
      available: parseInt(availableCount.rows[0].count, 10),
      in_maintenance: parseInt(maintenanceCount.rows[0].count, 10),
      assigned: parseInt(activeAssignments.rows[0].count, 10)
    },
    compliance: {
      expired_documents: parseInt(expiredDocs.rows[0].count, 10),
      expiring_within_30_days: parseInt(expiringDocs.rows[0].count, 10)
    },
    maintenance: {
      high_risk_vehicles: parseInt(highRiskVehicles.rows[0].count, 10)
    },
    branches: {
      total: parseInt(totalBranches.rows[0].count, 10)
    },
    drivers: {
      total: parseInt(totalDrivers.rows[0].count, 10)
    },
    checklists: {
      submitted_today: parseInt(checklistsToday.rows[0].count, 10)
    }
  };
};

/**
 * Get recent activity logs for the dashboard.
 */
export const getRecentActivity = async (limit: number = 10): Promise<any[]> => {
  const result = await db.query(
    `SELECT 'service_record' AS activity_type, sr.id, sr.service_type AS description,
            sr.created_at, v.vehicle_number
     FROM service_records sr
     JOIN vehicles v ON sr.vehicle_id = v.id
     UNION ALL
     SELECT 'compliance_document', cd.id, cd.document_type, cd.created_at, v.vehicle_number
     FROM compliance_documents cd
     JOIN vehicles v ON cd.vehicle_id = v.id
     UNION ALL
     SELECT 'assignment', a.id, 'Vehicle assigned', COALESCE(a.assigned_date, a.created_at, NOW()) AS created_at, v.vehicle_number
     FROM assignments a
     JOIN vehicles v ON a.vehicle_id = v.id
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
};

export default { getDashboardSummary, getRecentActivity };
