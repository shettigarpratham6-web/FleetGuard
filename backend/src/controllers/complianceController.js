const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.createDocument = async (req, res, next) => {
  try {
    const { vehicle_id, document_type, document_number, issue_date, expiry_date, status } = req.body;
    const uploaded_by = req.user.id;

    if (!vehicle_id || !document_type || !expiry_date) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Vehicle ID, document type, and expiry date are required.' });
    }

    // Verify vehicle exists
    const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleCheck.rows.length === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Invalid vehicle ID. Vehicle does not exist.' });
    }

    // Discard / Replace any existing document of the same document_type for this vehicle
    const existingDocs = await db.query(
      'SELECT id, file_url FROM compliance_documents WHERE vehicle_id = $1 AND document_type = $2',
      [vehicle_id, document_type]
    );

    for (const oldDoc of existingDocs.rows) {
      if (oldDoc.file_url) {
        const oldFilePath = path.join(__dirname, '../..', oldDoc.file_url);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            console.warn('Could not delete old file:', e.message);
          }
        }
      }
      await db.query('DELETE FROM compliance_documents WHERE id = $1', [oldDoc.id]);
    }

    // File URL format (relative path)
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;

    const queryText = `
      INSERT INTO compliance_documents (
        vehicle_id, document_type, document_number, issue_date, expiry_date, file_url, status, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await db.query(queryText, [
      vehicle_id,
      document_type,
      document_number || null,
      issue_date || null,
      expiry_date,
      file_url,
      status || 'Valid',
      uploaded_by
    ]);

    res.status(201).json({
      message: 'Compliance document uploaded successfully',
      document: result.rows[0]
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    if (error.code === '23514') {
      if (error.message && error.message.includes('check_document_dates')) {
        return res.status(400).json({ error: 'Expiry date must be on or after the issue date.' });
      }
      if (error.message && error.message.includes('document_type')) {
        return res.status(400).json({ error: 'Invalid document type. Must be Insurance, Inspection, PUC, or Fitness Certificate.' });
      }
      if (error.message && error.message.includes('status')) {
        return res.status(400).json({ error: 'Invalid document status. Must be Valid, Expired, or Pending.' });
      }
    }
    next(error);
  }
};

exports.getDocumentsByVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    const queryText = `
      SELECT cd.*, u.username as uploaded_by_username
      FROM compliance_documents cd
      LEFT JOIN users u ON cd.uploaded_by = u.id
      WHERE cd.vehicle_id = $1
      ORDER BY cd.expiry_date DESC
    `;
    const result = await db.query(queryText, [vehicleId]);

    // Keep only the latest document per document_type to discard old replaced entries
    const latestMap = new Map();
    for (const doc of result.rows) {
      if (!latestMap.has(doc.document_type)) {
        latestMap.set(doc.document_type, doc);
      }
    }
    const deduplicatedDocs = Array.from(latestMap.values());

    res.status(200).json({ documents: deduplicatedDocs });
  } catch (error) {
    next(error);
  }
};

exports.getAllDocuments = async (req, res, next) => {
  try {
    const { status, document_type, expiring_in_days } = req.query;
    let queryText = `
      SELECT cd.*, v.vehicle_number, v.registration_number, u.username as uploaded_by_username
      FROM compliance_documents cd
      JOIN vehicles v ON cd.vehicle_id = v.id
      LEFT JOIN users u ON cd.uploaded_by = u.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`cd.status = $${params.length}`);
    }

    if (document_type) {
      params.push(document_type);
      conditions.push(`cd.document_type = $${params.length}`);
    }

    if (expiring_in_days) {
      params.push(parseInt(expiring_in_days, 10));
      conditions.push(`cd.expiry_date <= CURRENT_DATE + CAST($${params.length} AS INTEGER) AND cd.expiry_date >= CURRENT_DATE`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY cd.expiry_date DESC';

    const result = await db.query(queryText, params);
    
    // Deduplicate so only the latest document per (vehicle_id, document_type) is returned
    const latestMap = new Map();
    for (const doc of result.rows) {
      const key = `${doc.vehicle_id}_${doc.document_type}`;
      if (!latestMap.has(key)) {
        latestMap.set(key, doc);
      }
    }
    const deduplicatedDocs = Array.from(latestMap.values());

    res.status(200).json({ documents: deduplicatedDocs });
  } catch (error) {
    next(error);
  }
};

exports.getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queryText = `
      SELECT cd.*, v.vehicle_number, v.registration_number, u.username as uploaded_by_username
      FROM compliance_documents cd
      JOIN vehicles v ON cd.vehicle_id = v.id
      LEFT JOIN users u ON cd.uploaded_by = u.id
      WHERE cd.id = $1
    `;
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance document not found.' });
    }

    res.status(200).json({ document: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { document_type, document_number, issue_date, expiry_date, status } = req.body;

    if (!document_type || !expiry_date) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Document type and expiry date are required.' });
    }

    // Fetch existing document to find current file
    const existingResult = await db.query('SELECT file_url FROM compliance_documents WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Compliance document not found.' });
    }
    const currentDoc = existingResult.rows[0];

    let file_url = currentDoc.file_url;
    if (req.file) {
      file_url = `/uploads/${req.file.filename}`;
      // Delete old file if exists
      if (currentDoc.file_url) {
        const oldFilePath = path.join(__dirname, '../..', currentDoc.file_url);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            console.warn('Could not delete old file:', e.message);
          }
        }
      }
    }

    const queryText = `
      UPDATE compliance_documents
      SET document_type = $1, document_number = $2, issue_date = $3, expiry_date = $4, file_url = $5, status = $6
      WHERE id = $7
      RETURNING *
    `;

    const result = await db.query(queryText, [
      document_type,
      document_number || null,
      issue_date || null,
      expiry_date,
      file_url,
      status || 'Valid',
      id
    ]);

    const updatedDoc = result.rows[0];

    res.status(200).json({
      message: 'Compliance document updated successfully',
      document: updatedDoc
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    if (error.code === '23514') {
      if (error.message && error.message.includes('check_document_dates')) {
        return res.status(400).json({ error: 'Expiry date must be on or after the issue date.' });
      }
    }
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queryText = 'DELETE FROM compliance_documents WHERE id = $1 RETURNING *';
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance document not found.' });
    }

    const deletedDoc = result.rows[0];

    // Delete associated physical file
    if (deletedDoc.file_url) {
      const filePath = path.join(__dirname, '../..', deletedDoc.file_url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Could not delete physical file:', e.message);
        }
      }
    }

    res.status(200).json({
      message: 'Compliance document deleted successfully',
      document: deletedDoc
    });
  } catch (error) {
    next(error);
  }
};

exports.getVehicleComplianceStatus = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(vehicleId)) {
      return res.status(400).json({ error: 'Invalid vehicle ID format.' });
    }

    // Verify vehicle exists
    const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [vehicleId]);
    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    // Get compliance documents ordered by expiry_date descending
    const queryText = `
      SELECT cd.*, (cd.expiry_date < CURRENT_DATE) AS is_expired, u.username as uploaded_by_username
      FROM compliance_documents cd
      LEFT JOIN users u ON cd.uploaded_by = u.id
      WHERE cd.vehicle_id = $1
      ORDER BY cd.expiry_date DESC
    `;
    const result = await db.query(queryText, [vehicleId]);
    const documents = result.rows;

    const mandatoryTypes = ['Insurance', 'PUC', 'Fitness Certificate'];
    const latestDocs = {};

    // Get the latest document for each type
    for (const doc of documents) {
      if (!latestDocs[doc.document_type]) {
        latestDocs[doc.document_type] = doc;
      }
    }

    const expiredDocuments = [];
    const missingDocuments = [];
    const activeDocuments = [];

    for (const type of mandatoryTypes) {
      const doc = latestDocs[type];
      if (!doc) {
        missingDocuments.push(type);
      } else if (doc.is_expired) {
        const { is_expired, ...cleanDoc } = doc;
        expiredDocuments.push(cleanDoc);
      } else {
        const { is_expired, ...cleanDoc } = doc;
        activeDocuments.push(cleanDoc);
      }
    }

    if (expiredDocuments.length > 0 || missingDocuments.length > 0) {
      return res.status(200).json({
        vehicle_id: vehicleId,
        overall_status: 'Non-Compliant',
        expired_documents: expiredDocuments,
        missing_documents: missingDocuments
      });
    }

    return res.status(200).json({
      vehicle_id: vehicleId,
      overall_status: 'Compliant',
      documents: activeDocuments
    });
  } catch (error) {
    next(error);
  }
};
