const db = require('../config/db');

exports.createChecklist = async (req, res, next) => {
  try {
    const {
      vehicle_id,
      tyres_ok,
      brakes_ok,
      lights_ok,
      horn_ok,
      mirrors_ok,
      remarks,
      status
    } = req.body;

    const driver_id = req.user.id;

    // Validate vehicle_id
    if (!vehicle_id) {
      return res.status(400).json({
        success: false,
        error: "Vehicle ID is required."
      });
    }

    // Validate boolean fields
    const checklistFields = {
      tyres_ok,
      brakes_ok,
      lights_ok,
      horn_ok,
      mirrors_ok
    };

    for (const [field, value] of Object.entries(checklistFields)) {
      if (typeof value !== "boolean") {
        return res.status(400).json({
          success: false,
          error: `${field} must be either true or false.`
        });
      }
    }

    // Check whether vehicle exists
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

    // Prevent duplicate checklist submission for today
    const existingChecklist = await db.query(
      `SELECT id
       FROM checklists
       WHERE vehicle_id = $1
         AND driver_id = $2
         AND checklist_date = CURRENT_DATE`,
      [vehicle_id, driver_id]
    );

    if (existingChecklist.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "You have already submitted today's pre-trip checklist for this vehicle."
      });
    }

    // Insert checklist
    const query = `
      INSERT INTO checklists (
        vehicle_id,
        driver_id,
        tyres_ok,
        brakes_ok,
        lights_ok,
        horn_ok,
        mirrors_ok,
        remarks,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `;

    const values = [
      vehicle_id,
      driver_id,
      tyres_ok,
      brakes_ok,
      lights_ok,
      horn_ok,
      mirrors_ok,
      remarks || null,
      status || "Completed"
    ];

    const result = await db.query(query, values);

    return res.status(201).json({
      success: true,
      message: "Driver pre-trip checklist submitted successfully.",
      checklist: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
};