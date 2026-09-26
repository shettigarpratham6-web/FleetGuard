import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/authRoutes';
import branchRoutes from './routes/branchRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import complianceRoutes from './routes/complianceRoutes';
import serviceRecordRoutes from './routes/serviceRecordRoutes';
import historicalServiceRoutes from './routes/historicalServiceRoutes';
import maintenanceRiskRoutes from './routes/maintenanceRiskRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import overrideLogRoutes from './routes/overrideLogRoutes';
import checklistRoutes from './routes/checklistRoutes';
import notificationRoutes from './routes/notificationRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import auditRoutes from './routes/auditRoutes';
import driverRoutes from './routes/driverRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/services', serviceRecordRoutes);
app.use('/api/historical-services', historicalServiceRoutes);
app.use('/api/maintenance-risks', maintenanceRiskRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/override-logs', overrideLogRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/drivers', driverRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the FleetGuard API',
    status: 'online',
    timestamp: new Date()
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

app.use((err: any, req: Request, res: Response, next: NextFunction): Response | void => {
  console.error('API Error:', err);

  if (err.message && err.message.includes('ECONNREFUSED')) {
    return res.status(500).json({ error: 'Database connection failed. Please ensure PostgreSQL is running.' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size limit exceeded. Maximum file size is 5MB.' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;
