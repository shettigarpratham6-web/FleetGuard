const supabase = require('../config/supabaseClient'); // Updated Supabase client import
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
    secure: port === 465,
    auth: { user, pass }
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

  try {
    // 1. Fetch compliance documents expiring in 10, 5, or 2 days
    const { data: docRows, error: docError } = await supabase
      .from('compliance_documents')
      .select(`
        id,
        document_type,
        document_number,
        expiry_date,
        uploaded_by,
        vehicles!inner (
          id,
          vehicle_number,
          registration_number,
          assignments (
            driver_id,
            assignment_status,
            users:users!assignments_driver_id_fkey (
              email,
              phone_number,
              full_name
            )
          )
        ),
        users (
          email,
          phone_number,
          full_name
        )
      `)
      .eq('status', 'Valid');

    if (docError) throw docError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredDocs = (docRows || []).map((doc) => {
      const expDate = new Date(doc.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate - today;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Active assignment search
      const activeAssignment = doc.vehicles?.assignments?.find(
        (a) => a.assignment_status === 'Active'
      );

      return {
        document_id: doc.id,
        document_type: doc.document_type,
        document_number: doc.document_number,
        expiry_date: doc.expiry_date,
        days_remaining: daysRemaining,
        vehicle_id: doc.vehicles?.id,
        vehicle_number: doc.vehicles?.vehicle_number,
        registration_number: doc.vehicles?.registration_number,
        driver_id: activeAssignment?.driver_id,
        driver_email: activeAssignment?.users?.email,
        driver_phone: activeAssignment?.users?.phone_number,
        driver_name: activeAssignment?.users?.full_name,
        owner_id: doc.uploaded_by,
        owner_email: doc.users?.email,
        owner_phone: doc.users?.phone_number,
        owner_name: doc.users?.full_name
      };
    }).filter((doc) => [10, 5, 2].includes(doc.days_remaining));

    console.log(`Found ${filteredDocs.length} expiring compliance documents.`);

    for (const doc of filteredDocs) {
      const days = doc.days_remaining;
      const title = `${doc.document_type} Expiring in ${days} Days`;
      const message = `The ${doc.document_type} (No: ${doc.document_number || 'N/A'}) for vehicle ${doc.vehicle_number} (${doc.registration_number}) is expiring on ${new Date(doc.expiry_date).toLocaleDateString()} (${days} days remaining). Please renew it immediately.`;

      const targetEmail = doc.driver_email || doc.owner_email || process.env.EMAIL_USER;
      const targetPhone = doc.driver_phone || doc.owner_phone;
      const targetName = doc.driver_name || doc.owner_name || 'Fleet Manager';
      const targetUserId = doc.driver_id || doc.owner_id;

      // Send In-App Notification using Supabase insert
      if (targetUserId) {
        await supabase.from('notifications').insert([{
          user_id: targetUserId,
          vehicle_id: doc.vehicle_id,
          title,
          message,
          notification_type: 'Compliance Alert'
        }]);
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
    const { data: serviceRows, error: serviceError } = await supabase
      .from('service_records')
      .select(`
        id,
        service_type,
        next_service_date,
        mechanic_id,
        vehicles!inner (
          id,
          vehicle_number,
          registration_number,
          assignments (
            driver_id,
            assignment_status,
            users:users!assignments_driver_id_fkey (
              email,
              phone_number,
              full_name
            )
          )
        ),
        users (
          email,
          phone_number,
          full_name
        )
      `)
      .not('next_service_date', 'is', null);

    if (serviceError) throw serviceError;

    const filteredServices = (serviceRows || []).map((service) => {
      const nextDate = new Date(service.next_service_date);
      nextDate.setHours(0, 0, 0, 0);
      const diffTime = nextDate - today;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const activeAssignment = service.vehicles?.assignments?.find(
        (a) => a.assignment_status === 'Active'
      );

      return {
        service_id: service.id,
        service_type: service.service_type,
        next_service_date: service.next_service_date,
        days_remaining: daysRemaining,
        vehicle_id: service.vehicles?.id,
        vehicle_number: service.vehicles?.vehicle_number,
        registration_number: service.vehicles?.registration_number,
        driver_id: activeAssignment?.driver_id,
        driver_email: activeAssignment?.users?.email,
        driver_phone: activeAssignment?.users?.phone_number,
        driver_name: activeAssignment?.users?.full_name,
        mechanic_id: service.mechanic_id,
        mech_email: service.users?.email,
        mech_phone: service.users?.phone_number,
        mech_name: service.users?.full_name
      };
    }).filter((service) => [10, 5, 2].includes(service.days_remaining));

    console.log(`Found ${filteredServices.length} upcoming scheduled services.`);

    for (const service of filteredServices) {
      const days = service.days_remaining;
      const title = `Scheduled Maintenance in ${days} Days`;
      const message = `Vehicle ${service.vehicle_number} (${service.registration_number}) has a scheduled ${service.service_type} on ${new Date(service.next_service_date).toLocaleDateString()} (${days} days remaining). Please prepare the vehicle for maintenance.`;

      const targetEmail = service.driver_email || service.mech_email || process.env.EMAIL_USER;
      const targetPhone = service.driver_phone || service.mech_phone;
      const targetName = service.driver_name || service.mech_name || 'Fleet Driver';
      const targetUserId = service.driver_id || service.mechanic_id;

      // Send In-App Notification
      if (targetUserId) {
        await supabase.from('notifications').insert([{
          user_id: targetUserId,
          vehicle_id: service.vehicle_id,
          title,
          message,
          notification_type: 'Maintenance Alert'
        }]);
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

    console.log('✅ Expiry alert scan completed successfully.');
  } catch (error) {
    console.error('❌ Error during alert scan:', error);
  }
};

module.exports = {
  sendEmail,
  sendSMS,
  checkAndSendExpiryAlerts
};