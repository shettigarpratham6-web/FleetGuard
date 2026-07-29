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
      ORDER BY cd.expiry_date ASC
    `;
    const result = await db.query(queryText, [vehicleId]);
    res.status(200).json({ documents: result.rows });
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

    queryText += ' ORDER BY cd.expiry_date ASC';

    const result = await db.query(queryText, params);
    res.status(200).json({ documents: result.rows });
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
          fs.unlinkSync(oldFilePath);
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

    // Check if the updated expiry_date is exactly 2 days from now
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(updatedDoc.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate - today;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining === 2) {
        const { sendEmail } = require('../services/notificationService');
        const title = `${updatedDoc.document_type} Expiring in 2 Days`;
        const message = `The ${updatedDoc.document_type} (No: ${updatedDoc.document_number || 'N/A'}) is expiring on ${expDate.toLocaleDateString()} (2 days remaining). Please renew it immediately.`;
        
        // 1. Fetch uploader details
        const uploaderRes = await db.query('SELECT id, email, full_name FROM users WHERE id = $1', [updatedDoc.uploaded_by]);
        const uploader = uploaderRes.rows[0];

        // 2. Fetch active driver for the vehicle
        const driverRes = await db.query(`
          SELECT u.id, u.email, u.full_name 
          FROM assignments a 
          JOIN users u ON a.driver_id = u.id 
          WHERE a.vehicle_id = $1 AND a.assignment_status = 'Active'
          LIMIT 1
        `, [updatedDoc.vehicle_id]);
        const driver = driverRes.rows[0];

        // 3. Fetch all Admin users
        const adminRes = await db.query("SELECT id, email, full_name FROM users WHERE role = 'Admin'");
        const admins = adminRes.rows;

        // Collect all distinct recipients to notify
        const recipients = new Map(); // email -> full_name
        admins.forEach(a => recipients.set(a.email, a.full_name));
        if (uploader) recipients.set(uploader.email, uploader.full_name);
        if (driver) recipients.set(driver.email, driver.full_name);

        const emailHtmlTemplate = (name) => `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">FleetGuard 🚛</h1>
              <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Unified Fleet Compliance & Management</p>
            </div>
            <div style="border-top: 1px solid #f1f5f9; padding-top: 25px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hello <strong>${name}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">This is an urgent reminder that a compliance document is expiring in 2 days:</p>
              
              <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; color: #78350f; font-size: 16px; font-weight: 600;">${updatedDoc.document_type} Expiry Warning</h3>
                <p style="margin: 0 0 5px 0; color: #475569; font-size: 14px;"><strong>Document Number:</strong> ${updatedDoc.document_number || 'N/A'}</p>
                <p style="margin: 0 0 5px 0; color: #475569; font-size: 14px;"><strong>Expiry Date:</strong> ${expDate.toLocaleDateString()}</p>
                <p style="margin: 0; color: #b45309; font-size: 14px; font-weight: 600;">Time Remaining: 2 days</p>
              </div>

              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">Please take necessary actions to renew this document immediately to avoid compliance penalties.</p>
            </div>
            <div style="border-top: 1px solid #f1f5f9; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">This is an automated system alert from FleetGuard. Please do not reply directly to this message.</p>
            </div>
          </div>
        `;

        // Send to each recipient
        for (const [email, name] of recipients.entries()) {
          sendEmail(email, `[FleetGuard Alert] ${title}`, message, emailHtmlTemplate(name)).catch(err => {
            console.error(`Failed to send email alert to ${email}:`, err);
          });
        }

        // Insert in-app notifications
        const userIds = new Set();
        admins.forEach(a => userIds.add(a.id));
        if (uploader) userIds.add(uploader.id);
        if (driver) userIds.add(driver.id);

        for (const userId of userIds) {
          await db.query(`
            INSERT INTO notifications (user_id, vehicle_id, title, message, notification_type)
            VALUES ($1, $2, $3, $4, $5)
          `, [userId, updatedDoc.vehicle_id, title, message, 'Compliance Alert']);
        }
      }
    } catch (err) {
      console.error('⚠️ Could not process instant 2-day alert on update:', err.message);
    }

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
        fs.unlinkSync(filePath);
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

    const mandatoryTypes = ['Insurance', 'Inspection', 'PUC', 'Fitness Certificate'];
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

