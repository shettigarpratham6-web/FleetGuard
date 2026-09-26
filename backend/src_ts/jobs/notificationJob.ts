import { checkAndSendExpiryAlerts } from '../services/notificationService';

let cron: any;
try {
  cron = require('node-cron');
} catch (e) {
  console.warn('[NotificationJob] node-cron not available, using setInterval fallback.');
}

export const startNotificationJob = (): void => {
  console.log('🔔 Initializing Notification Job Scheduler...');

  const runJob = async () => {
    try {
      console.log('[NotificationJob] Running notification scan...');
      await checkAndSendExpiryAlerts();
      console.log('[NotificationJob] Notification scan completed.');
    } catch (error: any) {
      console.error('[NotificationJob] Error during notification scan:', error.message);
    }
  };

  if (cron) {
    cron.schedule('0 8 * * *', runJob);
    console.log('🔔 Notification cron job scheduled at 08:00 daily.');
  } else {
    setInterval(runJob, 24 * 60 * 60 * 1000);
    console.log('🔔 Notification interval scheduler started (24h fallback).');
  }
};

export default startNotificationJob;
