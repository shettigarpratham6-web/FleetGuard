require('dotenv').config();
const app = require('./app');
const initDb = require('./config/initDb');
const startExpiryAlertJob = require('./jobs/expiryAlertJob');
const { initExpiryCron } = require('./services/expiryCron');
const PORT = process.env.PORT || 5000;
initExpiryCron();
const startServer = async () => {
    try {
        if (typeof initDb === 'function') {
            await initDb();
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            console.log(`🌐 API URL: http://localhost:${PORT}`);

            startExpiryAlertJob();
        });
    } catch (error) {
        console.error('❌ CRITICAL: Server failed to start due to database initialization error:', error);
        process.exit(1);
    }
};

startServer();