const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const initDb = require('../config/initDb');

const seed = async () => {
  // Auto-run schema initialization/migration first
  await initDb();

  const client = await pool.connect();
  try {
    console.log('Seeding initial data...');
    await client.query('BEGIN');

    // 1. Seed Users
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    let adminId, managerId;
    
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      console.log('No users found. Seeding admin and manager...');
      const salt = await bcrypt.genSalt(10);
      const adminPass = await bcrypt.hash('admin123', salt);
      const managerPass = await bcrypt.hash('manager123', salt);

      const adminResult = await client.query(`
        INSERT INTO users (username, email, password_hash, role, full_name)
        VALUES ('admin', 'admin@fleetguard.com', $1, 'Admin', 'Admin User')
        RETURNING id
      `, [adminPass]);
      adminId = adminResult.rows[0].id;

      const managerResult = await client.query(`
        INSERT INTO users (username, email, password_hash, role, full_name)
        VALUES ('manager', 'manager@fleetguard.com', $1, 'Fleet Manager', 'Fleet Manager')
        RETURNING id
      `, [managerPass]);
      managerId = managerResult.rows[0].id;
      
      console.log('Users seeded successfully. Default logins:');
      console.log('  Admin Login:   admin@fleetguard.com / admin123');
      console.log('  Manager Login: manager@fleetguard.com / manager123');
    } else {
      const adminResult = await client.query("SELECT id FROM users WHERE role = 'Admin' LIMIT 1");
      adminId = adminResult.rows[0]?.id;
    }

    // 2. Seed Branches
    const branchCheck = await client.query('SELECT COUNT(*) FROM branches');
    let branchId;
    if (parseInt(branchCheck.rows[0].count, 10) === 0) {
      console.log('No branches found. Seeding main branch...');
      const branchResult = await client.query(`
        INSERT INTO branches (branch_name, city, manager_name, phone_number)
        VALUES ('Main HQ Branch', 'New York', 'John Doe', '+1-555-0199')
        RETURNING id
      `);
      branchId = branchResult.rows[0].id;
      console.log('Main branch seeded successfully.');
    } else {
      const branchResult = await client.query('SELECT id FROM branches LIMIT 1');
      branchId = branchResult.rows[0]?.id;
    }

    // 3. Seed Vehicles
    const vehicleCheck = await client.query('SELECT COUNT(*) FROM vehicles');
    let vehicleId;
    if (parseInt(vehicleCheck.rows[0].count, 10) === 0 && branchId) {
      console.log('No vehicles found. Seeding sample vehicle...');
      const vehicleResult = await client.query(`
        INSERT INTO vehicles (
          vehicle_number, registration_number, vehicle_type, manufacturer, model,
          manufacturing_year, fuel_type, current_mileage, purchase_date, branch_id, status
        )
        VALUES (
          'FG-01-NY-2026', 'REG-NY-89312A', 'Sedan', 'Toyota', 'Prius',
          2024, 'Hybrid', 15200, '2024-05-12', $1, 'Available'
        )
        RETURNING id
      `, [branchId]);
      vehicleId = vehicleResult.rows[0].id;
      console.log('Sample vehicle seeded successfully.');
    } else {
      const vehicleResult = await client.query('SELECT id FROM vehicles LIMIT 1');
      vehicleId = vehicleResult.rows[0]?.id;
    }

    // 4. Seed Service Records
    const serviceCheck = await client.query('SELECT COUNT(*) FROM service_records');
    if (parseInt(serviceCheck.rows[0].count, 10) === 0 && vehicleId) {
      console.log('No service records found. Seeding sample service record...');
      await client.query(`
        INSERT INTO service_records (
          vehicle_id, mechanic_id, service_date, current_mileage, service_type,
          description, parts_changed, labour_cost, parts_cost, next_service_mileage, next_service_date
        )
        VALUES (
          $1, $2, '2026-01-15', 10000, 'Routine Maintenance',
          'Oil change and tire rotation', 'Oil filter, Cabin air filter', 50.00, 45.00, 15000, '2026-07-15'
        )
      `, [vehicleId, adminId]);
      console.log('Sample service record seeded successfully.');
    }

    // 5. Seed Historical Services
    const historicalCheck = await client.query('SELECT COUNT(*) FROM historical_services');
    if (parseInt(historicalCheck.rows[0].count, 10) === 0 && vehicleId) {
      console.log('No historical services found. Seeding sample historical entry...');
      await client.query(`
        INSERT INTO historical_services (
          vehicle_id, service_date, mileage, description, entered_by, remarks
        )
        VALUES (
          $1, '2025-06-10', 5000, 'Brake pad replacement', $2, 'Front brake pads replaced'
        )
      `, [vehicleId, adminId]);
      console.log('Sample historical entry seeded successfully.');
    }

    // 6. Recalculate maintenance risk for the seeded vehicle
    if (vehicleId) {
      const { recalculateMaintenanceRisk } = require('../services/riskService');
      await recalculateMaintenanceRisk(vehicleId);
      console.log('Calculated and seeded maintenance risk for sample vehicle.');
    }

    await client.query('COMMIT');
    console.log('Database seeding process finished.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
  } finally {
    client.release();
    pool.end();
  }
};

seed();
