let cron;
try {
    cron = require('node-cron');
} catch (e) {
    console.warn('⚠️ node-cron is not installed. Fallback scheduler will be used. Install with "npm install node-cron"');
}

let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (e) {
    console.warn('⚠️ nodemailer is not installed. Expiry emails will be printed to console. Install with "npm install nodemailer"');
}

const db = require('../config/db');

// Set up Nodemailer transporter (Configure with your SMTP credentials)
const getTransporter = () => {
    if (!nodemailer || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return null;
    }
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * Checks for compliance documents expiring in 5 days and sends emails.
 */
const checkExpiringDocuments = async () => {
    console.log('[CRON] Checking for compliance documents expiring in 5 days...');

    try {
        // Query documents expiring exactly 5 days from today
        const queryText = `
      SELECT 
        cd.id AS document_id,
        cd.document_type,
        cd.expiry_date,
        v.vehicle_number,
        v.registration_number,
        u.email AS user_email,
        u.username
      FROM compliance_documents cd
      JOIN vehicles v ON cd.vehicle_id = v.id
      JOIN users u ON cd.uploaded_by = u.id
      WHERE cd.expiry_date = CURRENT_DATE + INTERVAL '5 days'
    `;

        const { rows: expiringDocs } = await db.query(queryText);

        if (expiringDocs.length === 0) {
            console.log('[CRON] No documents expiring in 5 days.');
            return;
        }

        const transporter = getTransporter();

        // Send emails for each expiring document
        for (const doc of expiringDocs) {
            if (transporter) {
                const mailOptions = {
                    from: `"Fleet Management" <${process.env.EMAIL_USER}>`,
                    to: doc.user_email,
                    subject: `⚠️ Action Required: Document Expiring in 5 Days (${doc.document_type})`,
                    html: `
              <h3>Hello ${doc.username},</h3>
              <p>This is an automated reminder that a compliance document for vehicle <strong>${doc.vehicle_number}</strong> (${doc.registration_number}) is set to expire in <strong>5 days</strong>.</p>
              <ul>
                <li><strong>Document Type:</strong> ${doc.document_type}</li>
                <li><strong>Expiry Date:</strong> ${new Date(doc.expiry_date).toDateString()}</li>
              </ul>
              <p>Please renew or update the compliance document as soon as possible to avoid operational downtime.</p>
            `
                };
                await transporter.sendMail(mailOptions);
                console.log(`[CRON] Expiry email sent to ${doc.user_email} for vehicle ${doc.vehicle_number}`);
            } else {
                console.log(`[CRON Simulation] Expiry alert: Document ${doc.document_type} for vehicle ${doc.vehicle_number} expires on ${new Date(doc.expiry_date).toDateString()}. Email to: ${doc.user_email}`);
            }
        }
    } catch (error) {
        console.error('[CRON Error] Failed to process document expiry check:', error.message);
    }
};

// Schedule job to run every day at 00:00 (Midnight) or fallback to 24h interval check
const initExpiryCron = () => {
    if (cron) {
        cron.schedule('0 0 * * *', () => {
            checkExpiringDocuments();
        });
        console.log('🗓️  Daily compliance expiry cron job initialized.');
    } else {
        // Run once every 24 hours
        setInterval(() => {
            checkExpiringDocuments();
        }, 24 * 60 * 60 * 1000);
        console.log('🗓️  Daily compliance expiry interval scheduler initialized (Fallback).');
    }
};

module.exports = { initExpiryCron, checkExpiringDocuments };