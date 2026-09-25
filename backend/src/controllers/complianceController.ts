const db = require('../config/db');
const fs = require('fs');
const path = require('path');

import { Request, Response, NextFunction } from 'express';


// ============================================================
// CREATE DOCUMENT
// ============================================================

exports.createDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      vehicle_id,
      document_type,
      document_number,
      issue_date,
      expiry_date,
      status
    } = req.body;

    const uploaded_by = req.user.id;

    if (!vehicle_id || !document_type || !expiry_date) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        error:
          'Vehicle ID, document type, and expiry date are required.'
      });
    }

    // Verify vehicle exists
    const vehicleCheck = await db.query(
      'SELECT id FROM vehicles WHERE id = $1',
      [vehicle_id]
    );

    if (vehicleCheck.rows.length === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        error:
          'Invalid vehicle ID. Vehicle does not exist.'
      });
    }

    // Discard / Replace any existing document
    // of the same document_type for this vehicle
    const existingDocs = await db.query(
      `SELECT id, file_url
       FROM compliance_documents
       WHERE vehicle_id = $1
       AND document_type = $2`,
      [vehicle_id, document_type]
    );

    for (const oldDoc of existingDocs.rows) {
      if (oldDoc.file_url) {
        const oldFilePath = path.join(
          __dirname,
          '../..',
          oldDoc.file_url
        );

        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            if (e instanceof Error) {
              console.warn(
                'Could not delete old file:',
                e.message
              );
            } else {
              console.warn(
                'Could not delete old file:',
                e
              );
            }
          }
        }
      }

      await db.query(
        'DELETE FROM compliance_documents WHERE id = $1',
        [oldDoc.id]
      );
    }

    // File URL format
    const file_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const queryText = `
      INSERT INTO compliance_documents (
        vehicle_id,
        document_type,
        document_number,
        issue_date,
        expiry_date,
        file_url,
        status,
        uploaded_by
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

    return res.status(201).json({
      message:
        'Compliance document uploaded successfully',
      document: result.rows[0]
    });

  } catch (error) {

    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        if (cleanupError instanceof Error) {
          console.warn(
            'Could not delete uploaded file:',
            cleanupError.message
          );
        }
      }
    }

    if (
      error &&
      typeof error === 'object' &&
      'code' in error
    ) {
      const dbError = error as {
        code: string;
        message?: string;
      };

      if (dbError.code === '23514') {

        if (
          dbError.message &&
          dbError.message.includes(
            'check_document_dates'
          )
        ) {
          return res.status(400).json({
            error:
              'Expiry date must be on or after the issue date.'
          });
        }

        if (
          dbError.message &&
          dbError.message.includes(
            'document_type'
          )
        ) {
          return res.status(400).json({
            error:
              'Invalid document type. Must be Insurance, Inspection, PUC, or Fitness Certificate.'
          });
        }

        if (
          dbError.message &&
          dbError.message.includes('status')
        ) {
          return res.status(400).json({
            error:
              'Invalid document status. Must be Valid, Expired, or Pending.'
          });
        }
      }
    }

    next(error);
  }
};


// ============================================================
// GET DOCUMENTS BY VEHICLE
// ============================================================

exports.getDocumentsByVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vehicleId } = req.params;

    if (typeof vehicleId !== 'string') {
      return res.status(400).json({
        error: 'Invalid vehicle ID.'
      });
    }

    const queryText = `
      SELECT cd.*, 
             u.username as uploaded_by_username
      FROM compliance_documents cd
      LEFT JOIN users u ON cd.uploaded_by = u.id
      WHERE cd.vehicle_id = $1
      ORDER BY cd.expiry_date DESC
    `;

    const result = await db.query(
      queryText,
      [vehicleId]
    );

    // Keep only the latest document per document_type
    const latestMap = new Map<string, any>();

    for (const doc of result.rows) {
      if (!latestMap.has(doc.document_type)) {
        latestMap.set(
          doc.document_type,
          doc
        );
      }
    }

    const deduplicatedDocs =
      Array.from(latestMap.values());

    return res.status(200).json({
      documents: deduplicatedDocs
    });

  } catch (error) {
    next(error);
  }
};


// ============================================================
// GET ALL DOCUMENTS
// ============================================================

exports.getAllDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      status,
      document_type,
      expiring_in_days
    } = req.query;

    let queryText = `
      SELECT cd.*, 
             v.vehicle_number,
             v.registration_number,
             u.username as uploaded_by_username
      FROM compliance_documents cd
      JOIN vehicles v ON cd.vehicle_id = v.id
      LEFT JOIN users u ON cd.uploaded_by = u.id
    `;

    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (typeof status === 'string') {
      params.push(status);

      conditions.push(
        `cd.status = $${params.length}`
      );
    }

    if (typeof document_type === 'string') {
      params.push(document_type);

      conditions.push(
        `cd.document_type = $${params.length}`
      );
    }

    if (typeof expiring_in_days === 'string') {
      const days = parseInt(
        expiring_in_days,
        10
      );

      if (!isNaN(days)) {
        params.push(days);

        conditions.push(
          `cd.expiry_date <= CURRENT_DATE + CAST($${params.length} AS INTEGER) AND cd.expiry_date >= CURRENT_DATE`
        );
      }
    }

    if (conditions.length > 0) {
      queryText +=
        ' WHERE ' +
        conditions.join(' AND ');
    }

    queryText +=
      ' ORDER BY cd.expiry_date DESC';

    const result = await db.query(
      queryText,
      params
    );

    // Deduplicate so only the latest document
    // per (vehicle_id, document_type) is returned
    const latestMap = new Map<string, any>();

    for (const doc of result.rows) {
      const key =
        `${doc.vehicle_id}_${doc.document_type}`;

      if (!latestMap.has(key)) {
        latestMap.set(key, doc);
      }
    }

    const deduplicatedDocs =
      Array.from(latestMap.values());

    return res.status(200).json({
      documents: deduplicatedDocs
    });

  } catch (error) {
    next(error);
  }
};


// ============================================================
// GET DOCUMENT BY ID
// ============================================================

exports.getDocumentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid document ID.'
      });
    }

    const queryText = `
      SELECT cd.*, 
             v.vehicle_number,
             v.registration_number,
             u.username as uploaded_by_username
      FROM compliance_documents cd
      JOIN vehicles v ON cd.vehicle_id = v.id
      LEFT JOIN users u ON cd.uploaded_by = u.id
      WHERE cd.id = $1
    `;

    const result = await db.query(
      queryText,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error:
          'Compliance document not found.'
      });
    }

    return res.status(200).json({
      document: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
};


// ============================================================
// UPDATE DOCUMENT
// ============================================================

exports.updateDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        error: 'Invalid document ID.'
      });
    }

    const {
      document_type,
      document_number,
      issue_date,
      expiry_date,
      status
    } = req.body;

    if (!document_type || !expiry_date) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        error:
          'Document type and expiry date are required.'
      });
    }

    // Fetch existing document to find current file
    const existingResult = await db.query(
      'SELECT file_url FROM compliance_documents WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(404).json({
        error:
          'Compliance document not found.'
      });
    }

    const currentDoc =
      existingResult.rows[0];

    let file_url = currentDoc.file_url;

    if (req.file) {
      file_url =
        `/uploads/${req.file.filename}`;

      // Delete old file if exists
      if (currentDoc.file_url) {
        const oldFilePath = path.join(
          __dirname,
          '../..',
          currentDoc.file_url
        );

        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            if (e instanceof Error) {
              console.warn(
                'Could not delete old file:',
                e.message
              );
            } else {
              console.warn(
                'Could not delete old file:',
                e
              );
            }
          }
        }
      }
    }

    const queryText = `
      UPDATE compliance_documents
      SET document_type = $1,
          document_number = $2,
          issue_date = $3,
          expiry_date = $4,
          file_url = $5,
          status = $6
      WHERE id = $7
      RETURNING *
    `;

    const result = await db.query(
      queryText,
      [
        document_type,
        document_number || null,
        issue_date || null,
        expiry_date,
        file_url,
        status || 'Valid',
        id
      ]
    );

    const updatedDoc =
      result.rows[0];

    return res.status(200).json({
      message:
        'Compliance document updated successfully',
      document: updatedDoc
    });

  } catch (error) {

    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        if (cleanupError instanceof Error) {
          console.warn(
            'Could not delete uploaded file:',
            cleanupError.message
          );
        }
      }
    }

    if (
      error &&
      typeof error === 'object' &&
      'code' in error
    ) {
      const dbError = error as {
        code: string;
        message?: string;
      };

      if (
        dbError.code === '23514' &&
        dbError.message &&
        dbError.message.includes(
          'check_document_dates'
        )
      ) {
        return res.status(400).json({
          error:
            'Expiry date must be on or after the issue date.'
        });
      }
    }

    next(error);
  }
};


// ============================================================
// DELETE DOCUMENT
// ============================================================

exports.deleteDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid document ID.'
      });
    }

    const queryText =
      'DELETE FROM compliance_documents WHERE id = $1 RETURNING *';

    const result = await db.query(
      queryText,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error:
          'Compliance document not found.'
      });
    }

    const deletedDoc =
      result.rows[0];

    // Delete associated physical file
    if (deletedDoc.file_url) {
      const filePath = path.join(
        __dirname,
        '../..',
        deletedDoc.file_url
      );

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          if (e instanceof Error) {
            console.warn(
              'Could not delete physical file:',
              e.message
            );
          } else {
            console.warn(
              'Could not delete physical file:',
              e
            );
          }
        }
      }
    }

    return res.status(200).json({
      message:
        'Compliance document deleted successfully',
      document: deletedDoc
    });

  } catch (error) {
    next(error);
  }
};


// ============================================================
// GET VEHICLE COMPLIANCE STATUS
// ============================================================

exports.getVehicleComplianceStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vehicleId } = req.params;

    if (typeof vehicleId !== 'string') {
      return res.status(400).json({
        error: 'Invalid vehicle ID.'
      });
    }

    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (!uuidRegex.test(vehicleId)) {
      return res.status(400).json({
        error:
          'Invalid vehicle ID format.'
      });
    }

    // Verify vehicle exists
    const vehicleCheck = await db.query(
      'SELECT id FROM vehicles WHERE id = $1',
      [vehicleId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Vehicle not found.'
      });
    }

    // Get compliance documents ordered by expiry_date descending
    const queryText = `
      SELECT cd.*,
             (cd.expiry_date < CURRENT_DATE) AS is_expired,
             u.username as uploaded_by_username
      FROM compliance_documents cd
      LEFT JOIN users u ON cd.uploaded_by = u.id
      WHERE cd.vehicle_id = $1
      ORDER BY cd.expiry_date DESC
    `;

    const result = await db.query(
      queryText,
      [vehicleId]
    );

    const documents =
      result.rows;

    const mandatoryTypes = [
      'Insurance',
      'PUC',
      'Fitness Certificate'
    ];

    const latestDocs: Record<
      string,
      any
    > = {};

    // Get the latest document for each type
    for (const doc of documents) {
      if (
        !latestDocs[doc.document_type]
      ) {
        latestDocs[
          doc.document_type
        ] = doc;
      }
    }

    const expiredDocuments: any[] = [];
    const missingDocuments: string[] = [];
    const activeDocuments: any[] = [];

    for (const type of mandatoryTypes) {
      const doc = latestDocs[type];

      if (!doc) {
        missingDocuments.push(type);
      } else if (doc.is_expired) {
        const {
          is_expired,
          ...cleanDoc
        } = doc;

        expiredDocuments.push(
          cleanDoc
        );
      } else {
        const {
          is_expired,
          ...cleanDoc
        } = doc;

        activeDocuments.push(
          cleanDoc
        );
      }
    }

    if (
      expiredDocuments.length > 0 ||
      missingDocuments.length > 0
    ) {
      return res.status(200).json({
        vehicle_id: vehicleId,
        overall_status:
          'Non-Compliant',
        expired_documents:
          expiredDocuments,
        missing_documents:
          missingDocuments
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