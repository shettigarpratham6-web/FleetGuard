const { checkAndSendExpiryAlerts } = require('../services/notificationService');

const startExpiryAlertJob = () => {
  console.log('⏰ Initializing Expiry Alert Job Scheduler...');

  setTimeout(async () => {
    try {
      await checkAndSendExpiryAlerts();
    } catch (error) {
      console.error('Error running initial expiry alert job:', error);
    }
  }, 5000);
  const intervalTime = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      await checkAndSendExpiryAlerts();
    } catch (error) {
      console.error('Error running scheduled expiry alert job:', error);
    }
  }, intervalTime);
};

module.exports = startExpiryAlertJob;
