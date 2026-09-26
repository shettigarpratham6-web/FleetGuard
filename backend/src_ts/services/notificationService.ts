import db from '../config/db';

export const sendEmail = async (to: string, subject: string, text?: string, html?: string): Promise<{ simulated: boolean; success: boolean }> => {
  console.log(`[Email Simulation - Suppressed] Sending to: ${to} | Subject: ${subject}`);
  return { simulated: true, success: true };
};

export const sendSMS = async (to: string, body: string): Promise<{ simulated: boolean; success: boolean }> => {
  console.log(`[SMS Simulation - Suppressed] Sending to: ${to}`);
  return { simulated: true, success: true };
};

export const checkAndSendExpiryAlerts = async (): Promise<void> => {
  console.log('⏳ Running scheduled compliance and service expiry alert scan...');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        AND (
          cd.expiry_date = CURRENT_DATE + INTERVAL '10 days' OR
          cd.expiry_date = CURRENT_DATE + INTERVAL '7 days' OR
          cd.expiry_date = CURRENT_DATE + INTERVAL '5 days'
        )
    `;

    const { rows: expiringDocs } = await db.query(docQuery);
    console.log(`[Alert Job] Found ${expiringDocs.length} expiring compliance documents.`);

    for (const doc of expiringDocs) {
      const expDate = new Date(doc.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const title = `${doc.document_type} Expiring in ${days} Days`;
      const message = `The ${doc.document_type} (No: ${doc.document_number || 'N/A'}) for vehicle ${doc.vehicle_number} (${doc.registration_number}) is expiring on ${expDate.toLocaleDateString()} (${days} days remaining). Please renew it immediately.`;

      const targetUserId = doc.driver_id || doc.uploaded_by;

      if (targetUserId) {
        await db.query(`
          INSERT INTO notifications (user_id, vehicle_id, title, message, notification_type)
          VALUES ($1, $2, $3, $4, $5)
        `, [targetUserId, doc.vehicle_id, title, message, 'Compliance Alert']);
        console.log(`[Alert Job] Inserted in-app compliance alert for user ${targetUserId} (vehicle ${doc.vehicle_number})`);
      }
    }

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
        AND (
          sr.next_service_date = CURRENT_DATE + INTERVAL '10 days' OR
          sr.next_service_date = CURRENT_DATE + INTERVAL '7 days' OR
          sr.next_service_date = CURRENT_DATE + INTERVAL '5 days'
        )
    `;

    const { rows: upcomingServices } = await db.query(serviceQuery);
    console.log(`[Alert Job] Found ${upcomingServices.length} upcoming scheduled services.`);

    for (const service of upcomingServices) {
      const nextDate = new Date(service.next_service_date);
      nextDate.setHours(0, 0, 0, 0);
      const diffTime = nextDate.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const title = `Scheduled Maintenance in ${days} Days`;
      const message = `Vehicle ${service.vehicle_number} (${service.registration_number}) has a scheduled ${service.service_type || 'Routine Maintenance'} on ${nextDate.toLocaleDateString()} (${days} days remaining). Please prepare the vehicle for maintenance.`;

      const targetUserId = service.driver_id || service.mechanic_id;

      if (targetUserId) {
        await db.query(`
          INSERT INTO notifications (user_id, vehicle_id, title, message, notification_type)
          VALUES ($1, $2, $3, $4, $5)
        `, [targetUserId, service.vehicle_id, title, message, 'Maintenance Alert']);
        console.log(`[Alert Job] Inserted in-app maintenance alert for user ${targetUserId} (vehicle ${service.vehicle_number})`);
      }
    }

    console.log('✅ Expiry alert scan completed successfully.');
  } catch (error: any) {
    console.error('❌ Error during alert scan:', error);
  }
};

export default {
  sendEmail,
  sendSMS,
  checkAndSendExpiryAlerts
};
