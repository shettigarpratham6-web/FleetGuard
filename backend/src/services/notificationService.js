const db = require('../config/db');
const env = require('../config/env');

/**
 * Mock sendEmail - disabled as per 'remove google notification' instruction
 */
const sendEmail = async (to, subject, text, html) => {
  console.log(`[Email Simulation - Suppressed] Sending to: ${to} | Subject: ${subject}`);
  return { simulated: true, success: true };
};

/**
 * Mock sendSMS - disabled as per 'remove google notification' instruction
 */
const sendSMS = async (to, body) => {
  console.log(`[SMS Simulation - Suppressed] Sending to: ${to}`);
  return { simulated: true, success: true };
};

/**
 * Ensure alert_settings table exists in PostgreSQL database
 */
const ensureAlertSettingsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS alert_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        setting_key VARCHAR(50) UNIQUE NOT NULL DEFAULT 'global',
        lead_days INTEGER[] DEFAULT '{30, 15, 7}',
        enable_email_alerts BOOLEAN DEFAULT TRUE,
        enable_in_app_alerts BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO alert_settings (setting_key, lead_days, enable_email_alerts, enable_in_app_alerts)
      VALUES ('global', '{30, 15, 7}', TRUE, TRUE)
      ON CONFLICT (setting_key) DO NOTHING;
    `);
  } catch (err) {
    console.warn('⚠️ Error checking alert_settings table:', err.message);
  }
};

/**
 * Clean up existing duplicate notifications in database keeping only the newest
 */
const cleanupDuplicateNotifications = async () => {
  try {
    await db.query(`
      DELETE FROM notifications n1
      USING notifications n2
      WHERE n1.user_id = n2.user_id
        AND n1.title = n2.title
        AND (n1.vehicle_id = n2.vehicle_id OR (n1.vehicle_id IS NULL AND n2.vehicle_id IS NULL))
        AND n1.created_at < n2.created_at;
    `);
  } catch (err) {
    console.warn('⚠️ Error cleaning up duplicate notifications:', err.message);
  }
};

/**
 * Get current configured alert settings (lead threshold days)
 */
const getAlertSettings = async () => {
  await ensureAlertSettingsTable();
  try {
    const { rows } = await db.query(
      `SELECT lead_days, enable_email_alerts, enable_in_app_alerts, updated_at FROM alert_settings WHERE setting_key = 'global'`
    );
    if (rows.length > 0) {
      return rows[0];
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch alert_settings, using defaults:', err.message);
  }
  return {
    lead_days: [30, 15, 7],
    enable_email_alerts: true,
    enable_in_app_alerts: true,
    updated_at: new Date()
  };
};

/**
 * Update alert lead time thresholds and preferences
 */
const updateAlertSettings = async (settings) => {
  await ensureAlertSettingsTable();
  const { lead_days, enable_email_alerts, enable_in_app_alerts } = settings;
  const daysArray = Array.isArray(lead_days) 
    ? Array.from(new Set(lead_days.map(Number).filter(n => !isNaN(n) && n > 0))).sort((a, b) => b - a) 
    : [30, 15, 7];

  const query = `
    INSERT INTO alert_settings (setting_key, lead_days, enable_email_alerts, enable_in_app_alerts, updated_at)
    VALUES ('global', $1, $2, $3, NOW())
    ON CONFLICT (setting_key) DO UPDATE
    SET lead_days = EXCLUDED.lead_days,
        enable_email_alerts = EXCLUDED.enable_email_alerts,
        enable_in_app_alerts = EXCLUDED.enable_in_app_alerts,
        updated_at = NOW()
    RETURNING lead_days, enable_email_alerts, enable_in_app_alerts, updated_at;
  `;
  const { rows } = await db.query(query, [
    daysArray,
    enable_email_alerts !== false,
    enable_in_app_alerts !== false
  ]);
  return rows[0];
};

/**
 * Perform compliance and service expiry scan across all vehicles and dispatch notifications
 */
const checkAndSendExpiryAlerts = async () => {
  console.log('⏳ Running scheduled compliance and service expiry alert scan...');

  try {
    await cleanupDuplicateNotifications();
    const settings = await getAlertSettings();
    const leadDays = settings.lead_days || [30, 15, 7];
    const maxLeadDay = Math.max(...leadDays, 30);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let createdCount = 0;
    let evaluatedDocs = 0;
    let evaluatedServices = 0;

    // Fetch managers and admins who receive all fleet compliance & maintenance alerts
    const managerRes = await db.query(
      "SELECT id FROM users WHERE role IN ('Admin', 'Fleet Manager', 'Manager')"
    );
    const managerIds = managerRes.rows.map(r => r.id);

    // 1. Fetch compliance documents expiring within the lead window or overdue
    const docQuery = `
      SELECT 
        cd.id AS document_id,
        cd.document_type,
        cd.document_number,
        cd.expiry_date,
        cd.uploaded_by,
        cd.vehicle_id,
        v.vehicle_number,
        v.registration_number,
        a.driver_id
      FROM compliance_documents cd
      JOIN vehicles v ON cd.vehicle_id = v.id
      LEFT JOIN assignments a ON a.vehicle_id = cd.vehicle_id AND a.assignment_status = 'Active'
      WHERE cd.status = 'Valid'
        AND (cd.expiry_date <= CURRENT_DATE + CAST($1 AS INTEGER) * INTERVAL '1 day')
      ORDER BY cd.expiry_date ASC
    `;

    const { rows: expiringDocs } = await db.query(docQuery, [maxLeadDay]);
    evaluatedDocs = expiringDocs.length;
    console.log(`[Alert Job] Found ${expiringDocs.length} compliance documents expiring within ${maxLeadDay} days or overdue.`);

    for (const doc of expiringDocs) {
      const expDate = new Date(doc.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate - today;
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const title = days <= 0
        ? `OVERDUE: ${doc.document_type} Has Expired`
        : `${doc.document_type} Expiring in ${days} Days`;
      const message = days <= 0
        ? `The ${doc.document_type} (No: ${doc.document_number || 'N/A'}) for vehicle ${doc.vehicle_number} (${doc.registration_number}) expired on ${expDate.toLocaleDateString()}. This vehicle is NON-COMPLIANT and cannot be assigned without an override. Please renew immediately.`
        : `The ${doc.document_type} (No: ${doc.document_number || 'N/A'}) for vehicle ${doc.vehicle_number} (${doc.registration_number}) is expiring on ${expDate.toLocaleDateString()} (${days} days remaining). Please renew it before expiry.`;

      // Recipient targets: Fleet Managers, Admins, and assigned Driver
      const recipientIds = new Set(managerIds);
      if (doc.driver_id) recipientIds.add(doc.driver_id);
      if (doc.uploaded_by) recipientIds.add(doc.uploaded_by);

      for (const targetUserId of recipientIds) {
        // Skip if notification already exists for this target user and title
        const dupCheck = await db.query(`
          SELECT id FROM notifications
          WHERE user_id = $1 AND vehicle_id = $2 AND title = $3
        `, [targetUserId, doc.vehicle_id, title]);

        if (dupCheck.rows.length === 0) {
          await db.query(`
            INSERT INTO notifications (user_id, vehicle_id, title, message, notification_type)
            VALUES ($1, $2, $3, $4, $5)
          `, [targetUserId, doc.vehicle_id, title, message, 'Compliance Alert']);
          createdCount++;
          console.log(`[Alert Job] Created compliance alert for user ${targetUserId} (vehicle ${doc.vehicle_number})`);
        }
      }
    }

    // 2. Fetch service records where next_service_date is within lead window or overdue
    const serviceQuery = `
      SELECT 
        sr.id AS service_id,
        sr.service_type,
        sr.next_service_date,
        sr.mechanic_id,
        sr.vehicle_id,
        v.vehicle_number,
        v.registration_number,
        a.driver_id
      FROM service_records sr
      JOIN vehicles v ON sr.vehicle_id = v.id
      LEFT JOIN assignments a ON a.vehicle_id = sr.vehicle_id AND a.assignment_status = 'Active'
      WHERE sr.next_service_date IS NOT NULL
        AND (sr.next_service_date <= CURRENT_DATE + CAST($1 AS INTEGER) * INTERVAL '1 day')
      ORDER BY sr.next_service_date ASC
    `;

    const { rows: upcomingServices } = await db.query(serviceQuery, [maxLeadDay]);
    evaluatedServices = upcomingServices.length;
    console.log(`[Alert Job] Found ${upcomingServices.length} scheduled services due within ${maxLeadDay} days or overdue.`);

    for (const service of upcomingServices) {
      const nextDate = new Date(service.next_service_date);
      nextDate.setHours(0, 0, 0, 0);
      const diffTime = nextDate - today;
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const title = days <= 0
        ? `OVERDUE: Scheduled Maintenance Missed`
        : `Scheduled Maintenance in ${days} Days`;
      const message = days <= 0
        ? `Vehicle ${service.vehicle_number} (${service.registration_number}) has a MISSED ${service.service_type || 'Routine Maintenance'} that was due on ${nextDate.toLocaleDateString()}. Please schedule service immediately.`
        : `Vehicle ${service.vehicle_number} (${service.registration_number}) has a scheduled ${service.service_type || 'Routine Maintenance'} on ${nextDate.toLocaleDateString()} (${days} days remaining). Please prepare the vehicle for maintenance.`;

      const recipientIds = new Set(managerIds);
      if (service.driver_id) recipientIds.add(service.driver_id);
      if (service.mechanic_id) recipientIds.add(service.mechanic_id);

      for (const targetUserId of recipientIds) {
        const dupCheck = await db.query(`
          SELECT id FROM notifications
          WHERE user_id = $1 AND vehicle_id = $2 AND title = $3
        `, [targetUserId, service.vehicle_id, title]);

        if (dupCheck.rows.length === 0) {
          await db.query(`
            INSERT INTO notifications (user_id, vehicle_id, title, message, notification_type)
            VALUES ($1, $2, $3, $4, $5)
          `, [targetUserId, service.vehicle_id, title, message, 'Maintenance Alert']);
          createdCount++;
          console.log(`[Alert Job] Created maintenance alert for user ${targetUserId} (vehicle ${service.vehicle_number})`);
        }
      }
    }

    await cleanupDuplicateNotifications();

    console.log(`✅ Expiry alert scan completed. Evaluated: ${evaluatedDocs} docs, ${evaluatedServices} services. Created ${createdCount} new notifications.`);
    return {
      success: true,
      leadDays,
      evaluatedDocs,
      evaluatedServices,
      createdCount
    };
  } catch (error) {
    console.error('❌ Error during alert scan:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendSMS,
  getAlertSettings,
  updateAlertSettings,
  checkAndSendExpiryAlerts,
  cleanupDuplicateNotifications
};