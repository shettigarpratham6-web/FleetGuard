const db = require('../config/db');

exports.getDashboard = async (req, res, next) => {
  try {
    const vehicleCountRes = await db.query('SELECT COUNT(*) FROM vehicles');
    const activeAssignmentsRes = await db.query("SELECT COUNT(*) FROM assignments WHERE assignment_status = 'Active'");
    const maintenanceCountRes = await db.query("SELECT COUNT(*) FROM vehicles WHERE status = 'Maintenance'");
    const complianceExpiriesRes = await db.query(
      "SELECT COUNT(*) FROM compliance_documents WHERE expiry_date <= CURRENT_DATE"
    );

    res.status(200).json({
      summary: {
        totalVehicles: parseInt(vehicleCountRes.rows[0].count, 10),
        activeAssignments: parseInt(activeAssignmentsRes.rows[0].count, 10),
        vehiclesInMaintenance: parseInt(maintenanceCountRes.rows[0].count, 10),
        expiredComplianceDocuments: parseInt(complianceExpiriesRes.rows[0].count, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};
