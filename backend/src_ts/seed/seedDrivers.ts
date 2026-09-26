import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import initDb from '../config/initDb';

const sampleDrivers = [
  { username: 'driver_john', email: 'john.doe@fleetguard.com', full_name: 'John Doe', phone_number: '+1-555-0101' },
  { username: 'driver_jane', email: 'jane.smith@fleetguard.com', full_name: 'Jane Smith', phone_number: '+1-555-0102' },
  { username: 'driver_mike', email: 'mike.jones@fleetguard.com', full_name: 'Mike Jones', phone_number: '+1-555-0103' },
  { username: 'driver_sara', email: 'sara.lee@fleetguard.com', full_name: 'Sara Lee', phone_number: '+1-555-0104' },
];

export const seedDrivers = async (): Promise<void> => {
  await initDb();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('driver123', salt);

    let created = 0;
    let skipped = 0;

    for (const d of sampleDrivers) {
      const existing = await client.query(
        'SELECT id FROM users WHERE email = $1 LIMIT 1',
        [d.email]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, phone_number, role, status)
         VALUES ($1, $2, $3, $4, $5, 'Driver', 'Active')`,
        [d.username, d.email, defaultPasswordHash, d.full_name, d.phone_number]
      );
      created++;
    }

    await client.query('COMMIT');
    console.log(`✅ Drivers seeded: ${created} created, ${skipped} skipped.`);
    console.log('   Default password for all drivers: driver123');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Driver seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedDrivers().then(async () => {
    await pool.end();
  });
}

export default seedDrivers;
