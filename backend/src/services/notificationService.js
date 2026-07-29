const db = require('../config/db');
const env = require('../config/env');

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('⚠️ nodemailer is not installed. Email notifications will be logged to console. Install with "npm install nodemailer"');
}

let twilio;
try {
  twilio = require('twilio');
} catch (e) {
  console.warn('⚠️ twilio is not installed. SMS notifications will be logged to console. Install with "npm install twilio"');
}

// Nodemailer Transporter Setup
const getTransporter = () => {
  if (!nodemailer) return null;
  
  // Use Gmail SMTP configuration
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('⚠️ Missing EMAIL_USER or EMAIL_PASS in environment variables. Email sending is in simulation mode.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });
};

// Twilio Client Setup
const getTwilioClient = () => {
  if (!twilio) return null;
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('⚠️ Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER in environment variables. SMS sending is in simulation mode.');
    return null;
  }

  return {
    client: twilio(accountSid, authToken),
    fromNumber
  };
};

/**
 * Send Gmail notification
 */
const sendEmail = async (to, subject, text, html) => {
  console.log(`[Email Simulation] Sending to: ${to} | Subject: ${subject}`);
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Email Mock Body]: ${text}`);
    return { simulated: true, success: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"FleetGuard Alerts" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`✉️ Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send SMS notification via Twilio
 */
const sendSMS = async (to, body) => {
  console.log(`[SMS Simulation] Sending to: ${to}`);
  if (!to) {
    console.log('⚠️ SMS failed: No destination phone number provided.');
    return { success: false, error: 'No phone number provided' };
  }

  const twilioSetup = getTwilioClient();
  if (!twilioSetup) {
    console.log(`[SMS Mock Body]: ${body}`);
    return { simulated: true, success: true };
  }

  try {
    const message = await twilioSetup.client.messages.create({
      body,
      from: twilioSetup.fromNumber,
      to
    });
    console.log(`💬 SMS sent successfully: SID ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Scans database for compliance documents expiring in exactly 10, 5, or 2 days,
 * and service records with next service date in exactly 10, 5, or 2 days.
 */
const checkAndSendExpiryAlerts = async () => {
  console.log('⏳ Running scheduled compliance and service expiry alert scan...');
  
  // Connect to db
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch compliance documents expiring in 10, 5, or 2 days
    const documentQuery = `
      SELECT cd.id as document_id, cd.document_type, cd.document_number, cd.expiry_date,
             cd.expiry_date - CURRENT_DATE as days_remaining,
             v.id as vehicle_id, v.vehicle_number, v.registration_number,
             a.driver_id,
             u.email as driver_email, u.phone_number as driver_phone, u.full_name as driver_name,
             owner.email as owner_email, owner.phone_number as owner_phone, owner.full_name as owner_name
      FROM compliance_documents cd
      JOIN vehicles v ON cd.vehicle_id = v.id
      LEFT JOIN assignments a ON v.id = a.vehicle_id AND a.assignment_status = 'Active'
      LEFT JOIN users u ON a.driver_id = u.id
      LEFT JOIN users owner ON cd.uploaded_by = owner.id
      WHERE cd.status = 'Valid'
        AND (cd.expiry_date - CURRENT_DATE IN (10, 5, 2))
    `;
    const docResult = await client.query(documentQuery);
    console.log(`Found ${docResult.rows.length} expiring compliance documents.`);

    for (const doc of docResult.rows) {
      const days = doc.days_remaining;
      const title = `${doc.document_type} Expiring in ${days} Days`;
      const message = `The ${doc.document_type} (No: ${doc.document_number || 'N/A'}) for vehicle ${doc.vehicle_number} (${doc.registration_number}) is expiring on ${new Date(doc.expiry_date).toLocaleDateString()} (${days} days remaining). Please renew it immediately.`;

      // Determine who to notify. Notify the assigned driver if present, and fallback/cc the document uploader/manager
      const targetEmail = doc.driver_email || doc.owner_email || process.env.EMAIL_USER;
      const targetPhone = doc.driver_phone || doc.owner_phone;
      const targetName = doc.driver_name || doc.owner_name || 'Fleet Manager';
      const targetUserId = doc.driver_id || doc.owner_id; // Store in-app notification for the user

      // Send In-App Notification
      if (targetUserId) {
        await client.query(`
          INSERT INTO notifications (user_id, vehicle_id, title, message, notification_type)
          VALUES ($1, $2, $3, $4, 'Compliance Alert')
        `, [targetUserId, doc.vehicle_id, title, message]);
      }

      // Send Email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #d9534f;">⚠️ Compliance Expiry Warning</h2>
          <p>Hello <strong>${targetName}</strong>,</p>
          <p>This is an automated alert from <strong>FleetGuard</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee;" />
          <p><strong>Vehicle:</strong> ${doc.vehicle_number} (${doc.registration_number})</p>
          <p><strong>Document:</strong> ${doc.document_type}</p>
          <p><strong>Document Number:</strong> ${doc.document_number || 'N/A'}</p>
          <p><strong>Expiry Date:</strong> ${new Date(doc.expiry_date).toLocaleDateString()}</p>
          <p style="font-size: 16px; color: #d9534f;"><strong>Time Remaining:</strong> ${days} days</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee;" />
          <p>Please take necessary actions to renew this document before it expires to avoid regulatory compliance penalties.</p>
          <p style="font-size: 12px; color: #999;">Do not reply directly to this email. FleetGuard Management.</p>
        </div>
      `;
      await sendEmail(targetEmail, `[FleetGuard Alert] ${title}`, message, emailHtml);

      // Send SMS
      if (targetPhone) {
        const smsMessage = `FleetGuard Alert: ${doc.document_type} for vehicle ${doc.vehicle_number} expires in ${days} days on ${new Date(doc.expiry_date).toLocaleDateString()}. Please renew.`;
        await sendSMS(targetPhone, smsMessage);
      }
    }

    // 2. Fetch service records where next_service_date is in 10, 5, or 2 days
    const serviceQuery = `
      SELECT sr.id as service_id, sr.service_type, sr.next_service_date,
             sr.next_service_date - CURRENT_DATE as days_remaining,
             v.id as vehicle_id, v.vehicle_number, v.registration_number,
             a.driver_id,
             u.email as driver_email, u.phone_number as driver_phone, u.full_name as driver_name,
             mech.email as mech_email, mech.phone_number as mech_phone, mech.full_name as mech_name
      FROM service_records sr
      JOIN vehicles v ON sr.vehicle_id = v.id
      LEFT JOIN assignments a ON v.id = a.vehicle_id AND a.assignment_status = 'Active'
      LEFT JOIN users u ON a.driver_id = u.id
      LEFT JOIN users mech ON sr.mechanic_id = mech.id
      WHERE sr.next_service_date IS NOT NULL
        AND (sr.next_service_date - CURRENT_DATE IN (10, 5, 2))
    `;
    const serviceResult = await client.query(serviceQuery);
    console.log(`Found ${serviceResult.rows.length} upcoming scheduled services.`);

    for (const service of serviceResult.rows) {
      const days = service.days_remaining;
      const title = `Scheduled Maintenance in ${days} Days`;
      const message = `Vehicle ${service.vehicle_number} (${service.registration_number}) has a scheduled ${service.service_type} on ${new Date(service.next_service_date).toLocaleDateString()} (${days} days remaining). Please prepare the vehicle for maintenance.`;

      const targetEmail = service.driver_email || service.mech_email || process.env.EMAIL_USER;
      const targetPhone = service.driver_phone || service.mech_phone;
      const targetName = service.driver_name || service.mech_name || 'Fleet Driver';
      const targetUserId = service.driver_id || service.mechanic_id;

      // Send In-App Notification
      if (targetUserId) {
        await client.query(`
          INSERT INTO notifications (user_id, vehicle_id, title, message, notification_type)
          VALUES ($1, $2, $3, $4, 'Maintenance Alert')
        `, [targetUserId, service.vehicle_id, title, message]);
      }

      // Send Email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #337ab7;">📅 Upcoming Vehicle Service Alert</h2>
          <p>Hello <strong>${targetName}</strong>,</p>
          <p>This is a scheduled maintenance reminder from <strong>FleetGuard</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee;" />
          <p><strong>Vehicle:</strong> ${service.vehicle_number} (${service.registration_number})</p>
          <p><strong>Service Type:</strong> ${service.service_type}</p>
          <p><strong>Service Date:</strong> ${new Date(service.next_service_date).toLocaleDateString()}</p>
          <p style="font-size: 16px; color: #337ab7;"><strong>Time Remaining:</strong> ${days} days</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee;" />
          <p>Please ensure that the vehicle is routed to the designated service center on time.</p>
          <p style="font-size: 12px; color: #999;">Do not reply directly to this email. FleetGuard Management.</p>
        </div>
      `;
      await sendEmail(targetEmail, `[FleetGuard Alert] ${title}`, message, emailHtml);

      // Send SMS
      if (targetPhone) {
        const smsMessage = `FleetGuard Alert: Vehicle ${service.vehicle_number} has scheduled ${service.service_type} in ${days} days on ${new Date(service.next_service_date).toLocaleDateString()}.`;
        await sendSMS(targetPhone, smsMessage);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Expiry alert scan completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during alert scan:', error);
  } finally {
    client.release();
  }
};

module.exports = {
  sendEmail,
  sendSMS,
  checkAndSendExpiryAlerts
};
