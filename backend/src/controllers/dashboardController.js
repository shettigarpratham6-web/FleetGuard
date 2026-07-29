const db = require('../config/db');

exports.getDashboard = async (req, res, next) => {
  try {
<<<<<<< HEAD
    const [vehiclesRes, driversRes, assignmentsRes, overridesRes] = await Promise.all([
      db.query('SELECT COUNT(*) FROM vehicles'),
      db.query("SELECT COUNT(*) FROM users WHERE role = 'Driver'"),
      db.query("SELECT COUNT(*) FROM assignments WHERE assignment_status = 'Active'"),
      db.query("SELECT COUNT(*) FROM override_logs WHERE DATE(created_at) = CURRENT_DATE"),
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        totalVehicles: parseInt(vehiclesRes.rows[0].count, 10),
        totalDrivers: parseInt(driversRes.rows[0].count, 10),
        activeAssignments: parseInt(assignmentsRes.rows[0].count, 10),
        todayOverrides: parseInt(overridesRes.rows[0].count, 10),
=======
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
>>>>>>> 2c2a3e69832085d4d86a6f1323a911f3d90b0ea9
      }
    });
  } catch (error) {
    next(error);
  }
};
