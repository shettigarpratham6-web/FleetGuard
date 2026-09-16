/**
 * Notification Job — scheduled job for sending in-app notifications.
 * Runs daily using node-cron or setInterval fallback.
 */
const { checkAndSendExpiryAlerts } = require('../services/notificationService');

let cron;
try {
  cron = require('node-cron');
} catch (e) {
  console.warn('[NotificationJob] node-cron not available, using setInterval fallback.');
}

/**
 * Start the notification scheduling job.
 * Sends compliance and maintenance expiry alerts daily at 08:00.
 */
const startNotificationJob = () => {
  console.log('🔔 Initializing Notification Job Scheduler...');

  const runJob = async () => {
    try {
      console.log('[NotificationJob] Running notification scan...');
      await checkAndSendExpiryAlerts();
      console.log('[NotificationJob] Notification scan completed.');
    } catch (error) {
      console.error('[NotificationJob] Error during notification scan:', error.message);
    }
  };

  if (cron) {
    // Run daily at 08:00
    cron.schedule('0 8 * * *', runJob);
    console.log('🔔 Notification cron job scheduled at 08:00 daily.');
  } else {
    // Fallback: run every 24 hours
    setInterval(runJob, 24 * 60 * 60 * 1000);
    console.log('🔔 Notification interval scheduler started (24h fallback).');
  }
};

module.exports = startNotificationJob;
