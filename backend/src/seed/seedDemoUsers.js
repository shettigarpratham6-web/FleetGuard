/**
 * Quick User Seeder
 * Upserts the 4 standard demo user accounts into the PostgreSQL database.
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const initDb = require('../config/initDb');

const demoUsers = [
  {
    username: 'admin',
    email: 'admin@fleetguard.com',
    password: 'admin123',
    role: 'Admin',
    full_name: 'Demo Admin'
  },
  {
    username: 'manager',
    email: 'manager@fleetguard.com',
    password: 'manager123',
    role: 'Fleet Manager',
    full_name: 'Demo Manager'
  },
  {
    username: 'driver',
    email: 'driver@fleetguard.com',
    password: 'driver123',
    role: 'Driver',
    full_name: 'Demo Driver'
  },
  {
    username: 'service',
    email: 'service@fleetguard.com',
    password: 'service123',
    role: 'Service Center',
    full_name: 'Demo Service Tech'
  }
];

const seedDemoUsers = async () => {
  console.log('🔄 Initializing database checking schema...');
  const initSuccess = await initDb();
  if (initSuccess === false) {
    console.error('❌ Database schema initialization failed. Exiting.');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    console.log('🌱 Seeding demo users...');
    await client.query('BEGIN');

    for (const user of demoUsers) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(user.password, salt);

      const queryText = `
        INSERT INTO users (username, email, password_hash, role, full_name, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'Active', NOW(), NOW())
        ON CONFLICT (email) 
        DO UPDATE SET 
          username = EXCLUDED.username,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          full_name = EXCLUDED.full_name,
          status = 'Active',
          updated_at = NOW()
      `;

      await client.query(queryText, [
        user.username,
        user.email.toLowerCase(),
        passwordHash,
        user.role,
        user.full_name
      ]);

      console.log(`   - Upserted: ${user.email} (${user.role})`);
    }

    await client.query('COMMIT');
    console.log('✅ Demo users seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedDemoUsers().then(async () => {
    await pool.end();
  });
}

module.exports = seedDemoUsers;
