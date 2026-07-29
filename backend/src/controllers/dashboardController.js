const db = require('../config/db');

exports.getDashboard = async (req, res, next) => {
  try {
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
      }
    });
  } catch (error) {
    next(error);
  }
};
