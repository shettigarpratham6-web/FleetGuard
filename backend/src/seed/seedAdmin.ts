/**
 * Standalone Admin Seeder
 * Creates the default admin user if not present.
 */
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import initDb from '../config/initDb';

export const seedAdmin = async (): Promise<void> => {
  await initDb();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingAdmin = await client.query(
      "SELECT id FROM users WHERE email = 'admin@fleetguard.com' LIMIT 1"
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✅ Admin user already exists. Skipping.');
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      const result = await client.query(
        `INSERT INTO users (username, email, password_hash, role, full_name, status)
         VALUES ('admin', 'admin@fleetguard.com', $1, 'Admin', 'Admin User', 'Active')
         RETURNING id, email, role`,
        [passwordHash]
      );

      console.log('✅ Admin user created:', result.rows[0]);
    }

    await client.query('COMMIT');
    console.log('✅ Admin seeding complete.');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Admin seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedAdmin().then(async () => {
    await pool.end();
  });
}

export default seedAdmin;
