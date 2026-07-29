const db = require('../config/db');

exports.createBranch = async (req, res, next) => {
  try {
    const { branch_name, city, manager_name, phone_number } = req.body;

    if (!branch_name) {
      return res.status(400).json({ error: 'Branch name is required.' });
    }

    const queryText = `
      INSERT INTO branches (branch_name, city, manager_name, phone_number)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(queryText, [branch_name, city, manager_name, phone_number]);
    res.status(201).json({
      message: 'Branch created successfully',
      branch: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllBranches = async (req, res, next) => {
  try {
    const { city, search } = req.query;
    let queryText = 'SELECT * FROM branches';
    const params = [];
    const conditions = [];

    if (city) {
      params.push(city);
      conditions.push(`city = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(branch_name ILIKE $${params.length} OR manager_name ILIKE $${params.length} OR city ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await db.query(queryText, params);
    res.status(200).json({ branches: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getBranchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queryText = 'SELECT * FROM branches WHERE id = $1';
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    res.status(200).json({ branch: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { branch_name, city, manager_name, phone_number } = req.body;

    if (!branch_name) {
      return res.status(400).json({ error: 'Branch name is required.' });
    }

    const queryText = `
      UPDATE branches
      SET branch_name = $1, city = $2, manager_name = $3, phone_number = $4
      WHERE id = $5
      RETURNING *
    `;
    const result = await db.query(queryText, [branch_name, city, manager_name, phone_number, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    res.status(200).json({
      message: 'Branch updated successfully',
      branch: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if there are vehicles associated with this branch first
    const checkVehiclesText = 'SELECT COUNT(*) FROM vehicles WHERE branch_id = $1';
    const checkVehiclesResult = await db.query(checkVehiclesText, [id]);
    const vehicleCount = parseInt(checkVehiclesResult.rows[0].count, 10);

    if (vehicleCount > 0) {
      return res.status(400).json({
        error: `Cannot delete branch. There are ${vehicleCount} vehicles assigned to this branch. Please reassign or delete them first.`
      });
    }

    const queryText = 'DELETE FROM branches WHERE id = $1 RETURNING *';
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    res.status(200).json({
      message: 'Branch deleted successfully',
      branch: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
