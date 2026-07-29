const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const serviceRecordRoutes = require('./routes/serviceRecordRoutes');
const historicalServiceRoutes = require('./routes/historicalServiceRoutes');
const maintenanceRiskRoutes = require('./routes/maintenanceRiskRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const overrideLogRoutes = require('./routes/overrideLogRoutes');
const checklistRoutes = require('./routes/checklistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const driverRoute = require("./routes/driverRoute");
const dashboardRoutes = require("./routes/dashboardRoutes");
const auditRoutes = require("./routes/auditRoutes");
const maintenanceRoutes = require('./routes/maintenanceRoutes');



const app = express();

// Enable CORS
app.use(cors());

// Parse incoming request payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded compliance files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Register API Routes
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
app.use("/api/drivers", driverRoute);
app.use('/api/maintenance', maintenanceRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/audit", auditRoutes);

// Base route status check
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the FleetGuard API',
    status: 'online',
    timestamp: new Date()
  });
});

// Handle undefined routes (404)
app.use((req, res, next) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global central error handler middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  // PostgreSQL connection errors
  if (err.message && err.message.includes('ECONNREFUSED')) {
    return res.status(500).json({ error: 'Database connection failed. Please ensure PostgreSQL is running.' });
  }

  // Multer upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size limit exceeded. Maximum file size is 5MB.' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
