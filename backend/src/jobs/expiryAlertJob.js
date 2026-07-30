const { checkAndSendExpiryAlerts } = require('../services/notificationService');

/**
 * Initializes and schedules the compliance document and service expiry checks.
 * Runs immediately upon startup, and then every 24 hours.
 */
const startExpiryAlertJob = () => {
  console.log('⏰ Initializing Expiry Alert Job Scheduler...');
  
  // Run immediately upon server startup
  setTimeout(async () => {
    try {
      await checkAndSendExpiryAlerts();
    } catch (error) {
      console.error('Error running initial expiry alert job:', error);
    }
  }, 5000); // Wait 5 seconds after server startup to let database connections establish fully

  // Run once every 24 hours (24 * 60 * 60 * 1000 ms)
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
