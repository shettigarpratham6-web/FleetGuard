const db = require('../config/db');

exports.createOverrideLog = async (req, res, next) => {
  try {
    const { vehicle_id, reason, approval_status } = req.body;
    const manager_id = req.user.id;

    // Validate required fields
    if (!vehicle_id || !reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Vehicle ID and reason are required."
      });
    }

    // Validate approval status
    const validStatuses = ["Approved", "Rejected", "Pending"];
    const status = approval_status || "Approved";

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid approval status. Must be Approved, Rejected, or Pending."
      });
    }

    // Verify vehicle exists
    const vehicleCheck = await db.query(
      "SELECT id FROM vehicles WHERE id = $1",
      [vehicle_id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Vehicle not found."
      });
    }

    // Prevent duplicate override logs for today
    const duplicateCheck = await db.query(
      `SELECT id
       FROM override_logs
       WHERE vehicle_id = $1
         AND manager_id = $2
         AND reason = $3
         AND DATE(created_at) = CURRENT_DATE`,
      [vehicle_id, manager_id, reason]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "An override log with the same reason already exists for today."
      });
    }

    const approvedBy = status === "Approved" ? manager_id : null;

    const queryText = `
      INSERT INTO override_logs
      (
        vehicle_id,
        manager_id,
        reason,
        approval_status,
        approved_by
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `;

    const result = await db.query(queryText, [
      vehicle_id,
      manager_id,
      reason.trim(),
      status,
      approvedBy
    ]);

    return res.status(201).json({
      success: true,
      message: "Assignment override audit log created successfully.",
      overrideLog: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
};

exports.getAllOverrideLogs = async (req, res, next) => {
  try {

    const queryText = `
      SELECT
        ol.*,
        v.vehicle_number,
        v.registration_number,
        m.full_name AS manager_name,
        ab.full_name AS approved_by_name
      FROM override_logs ol
      JOIN vehicles v
        ON ol.vehicle_id = v.id
      JOIN users m
        ON ol.manager_id = m.id
      LEFT JOIN users ab
        ON ol.approved_by = ab.id
      ORDER BY ol.created_at DESC
    `;

    const result = await db.query(queryText);

    return res.status(200).json({
      success: true,
      total: result.rows.length,
      overrideLogs: result.rows
    });

  } catch (error) {
    next(error);
  }
};

exports.getOverrideLogById = async (req, res, next) => {
  try {

    const { id } = req.params;

    const queryText = `
      SELECT
        ol.*,
        v.vehicle_number,
        v.registration_number,
        m.full_name AS manager_name,
        ab.full_name AS approved_by_name
      FROM override_logs ol
      JOIN vehicles v
        ON ol.vehicle_id = v.id
      JOIN users m
        ON ol.manager_id = m.id
      LEFT JOIN users ab
        ON ol.approved_by = ab.id
      WHERE ol.id = $1
    `;

    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Override log not found."
      });
    }

    return res.status(200).json({
      success: true,
      overrideLog: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
};