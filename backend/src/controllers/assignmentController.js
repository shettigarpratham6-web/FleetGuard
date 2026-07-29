const db = require('../config/db');

exports.createAssignment = async (req, res, next) => {
  try {
    const { vehicle_id, driver_id, return_date, override_used, override_log_id } = req.body;
    const assigned_by = req.user.id;

    if (!vehicle_id || !driver_id) {
      return res.status(400).json({ error: 'Vehicle ID and Driver ID are required.' });
    }

    // Check if vehicle exists
    const vehicleRes = await db.query('SELECT id, status FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    const vehicle = vehicleRes.rows[0];

    // Check if driver exists and has Driver role
    const driverRes = await db.query("SELECT id, role FROM users WHERE id = $1 AND role = 'Driver'", [driver_id]);
    if (driverRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid Driver. User must be registered as a Driver.' });
    }

    // If vehicle is not available, check for override
    if (vehicle.status !== 'Available') {
      if (!override_used || !override_log_id) {
        return res.status(400).json({ 
          error: `Vehicle is currently ${vehicle.status}. An approved manager override is required to assign this vehicle.` 
        });
      }

      // Verify the override log exists and is approved
      const overrideRes = await db.query(
        "SELECT id FROM override_logs WHERE id = $1 AND approval_status = 'Approved'", 
        [override_log_id]
      );
      if (overrideRes.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or unapproved override log ID.' });
      }
    }

    // Insert assignment
    const insertQuery = `
      INSERT INTO assignments (
        vehicle_id, driver_id, assigned_by, return_date, override_used, override_log_id, assignment_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Active')
      RETURNING *
    `;
    const assignmentResult = await db.query(insertQuery, [
      vehicle_id,
      driver_id,
      assigned_by,
      return_date || null,
      override_used || false,
      override_log_id || null
    ]);

    // Update vehicle status to 'Assigned'
    await db.query("UPDATE vehicles SET status = 'Assigned' WHERE id = $1", [vehicle_id]);

    res.status(201).json({
      message: 'Vehicle assigned successfully',
      assignment: assignmentResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllAssignments = async (req, res, next) => {
  try {
    const { status, vehicle_id, driver_id } = req.query;
    let queryText = `
      SELECT a.*, 
             v.vehicle_number, v.registration_number, v.manufacturer, v.model,
             u.full_name as driver_name, u.email as driver_email,
             m.full_name as assigned_by_name
      FROM assignments a
      JOIN vehicles v ON a.vehicle_id = v.id
      JOIN users u ON a.driver_id = u.id
      JOIN users m ON a.assigned_by = m.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`a.assignment_status = $${params.length}`);
    }

    if (vehicle_id) {
      params.push(vehicle_id);
      conditions.push(`a.vehicle_id = $${params.length}`);
    }

    if (driver_id) {
      params.push(driver_id);
      conditions.push(`a.driver_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY a.assigned_date DESC';

    const result = await db.query(queryText, params);
    res.status(200).json({ assignments: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const queryText = `
      SELECT a.*, 
             v.vehicle_number, v.registration_number, v.manufacturer, v.model,
             u.full_name as driver_name, u.email as driver_email,
             m.full_name as assigned_by_name
      FROM assignments a
      JOIN vehicles v ON a.vehicle_id = v.id
      JOIN users u ON a.driver_id = u.id
      JOIN users m ON a.assigned_by = m.id
      WHERE a.id = $1
    `;
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    res.status(200).json({ assignment: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.returnVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignmentRes = await db.query(
      "SELECT vehicle_id, assignment_status FROM assignments WHERE id = $1", 
      [id]
    );

    if (assignmentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const assignment = assignmentRes.rows[0];
    if (assignment.assignment_status !== 'Active') {
      return res.status(400).json({ error: `Assignment is already ${assignment.assignment_status}.` });
    }

    // Complete assignment
    const updateAssignmentQuery = `
      UPDATE assignments
      SET assignment_status = 'Completed', return_date = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const updatedAssignment = await db.query(updateAssignmentQuery, [id]);

    // Update vehicle status back to 'Available'
    await db.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [assignment.vehicle_id]);

    res.status(200).json({
      message: 'Vehicle returned successfully. Assignment completed.',
      assignment: updatedAssignment.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignmentRes = await db.query(
      "SELECT vehicle_id, assignment_status FROM assignments WHERE id = $1", 
      [id]
    );

    if (assignmentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const assignment = assignmentRes.rows[0];
    if (assignment.assignment_status !== 'Active') {
      return res.status(400).json({ error: `Assignment is already ${assignment.assignment_status}.` });
    }

    // Cancel assignment
    const updateAssignmentQuery = `
      UPDATE assignments
      SET assignment_status = 'Cancelled', return_date = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const updatedAssignment = await db.query(updateAssignmentQuery, [id]);

    // Update vehicle status back to 'Available'
    await db.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [assignment.vehicle_id]);

    res.status(200).json({
      message: 'Assignment cancelled successfully.',
      assignment: updatedAssignment.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
