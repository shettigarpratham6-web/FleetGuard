import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const envPaths: string[] = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import app from './app';
import initDb from './config/initDb';
import startExpiryAlertJob from './jobs/expiryAlertJob';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (typeof initDb === 'function') {
      await initDb().catch((err: any) => {
        console.warn('⚠️ Database schema initialization skipped:', err.message);
      });
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);

      startExpiryAlertJob();
    });
  } catch (error: any) {
    console.error('❌ Server startup error:', error.message);
  }
};

startServer();
