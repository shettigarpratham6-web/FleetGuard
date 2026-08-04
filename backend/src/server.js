const path = require('path');
const fs = require('fs');

const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
}
const app = require('./app');
const initDb = require('./config/initDb');
const startExpiryAlertJob = require('./jobs/expiryAlertJob');
// initExpiryCron disabled to remove google notification flow
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        if (typeof initDb === 'function') {
            // Database is already initialized via Supabase SQL Editor
            // await initDb();
        }

        let currentPort = parseInt(PORT, 10);

        const listenOnPort = (portToTry) => {
            const server = app.listen(portToTry, () => {
                console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${portToTry}`);
                console.log(`🌐 API URL: http://localhost:${portToTry}`);

                startExpiryAlertJob();
            });

            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.warn(`⚠️ Port ${portToTry} is occupied. Retrying automatically on port ${portToTry + 1}...`);
                    listenOnPort(portToTry + 1);
                } else {
                    console.error('❌ CRITICAL: Server failed to start:', err);
                    process.exit(1);
                }
            });
        };

        listenOnPort(currentPort);
    } catch (error) {
        console.error('❌ CRITICAL: Server failed to start due to database initialization error:', error);
        process.exit(1);
    }
};

startServer();