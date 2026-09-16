/**
 * Standalone Vehicles Seeder
 * Creates sample vehicles across branches for testing.
 * Run: node src/seed/seedVehicles.js
 */
const { pool } = require('../config/db');
const initDb = require('../config/initDb');

const sampleVehicles = [
  { vehicle_number: 'FG-01-NY-2026', registration_number: 'REG-NY-89312A', vehicle_type: 'Sedan', manufacturer: 'Toyota', model: 'Prius', manufacturing_year: 2024, fuel_type: 'Hybrid', current_mileage: 15200, purchase_date: '2024-05-12', status: 'Available' },
  { vehicle_number: 'FG-02-NY-2026', registration_number: 'REG-NY-74521B', vehicle_type: 'SUV', manufacturer: 'Honda', model: 'CR-V', manufacturing_year: 2023, fuel_type: 'Petrol', current_mileage: 22400, purchase_date: '2023-08-20', status: 'Available' },
  { vehicle_number: 'FG-03-NY-2026', registration_number: 'REG-NY-55234C', vehicle_type: 'Truck', manufacturer: 'Ford', model: 'F-150', manufacturing_year: 2022, fuel_type: 'Diesel', current_mileage: 48000, purchase_date: '2022-03-15', status: 'Available' },
  { vehicle_number: 'FG-04-NY-2026', registration_number: 'REG-NY-33671D', vehicle_type: 'Van', manufacturer: 'Mercedes', model: 'Sprinter', manufacturing_year: 2023, fuel_type: 'Diesel', current_mileage: 31500, purchase_date: '2023-11-01', status: 'Maintenance' },
];

const seedVehicles = async () => {
  await initDb();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const branchResult = await client.query('SELECT id FROM branches ORDER BY created_at ASC LIMIT 1');
    if (branchResult.rows.length === 0) {
      throw new Error('No branches found. Run seedDb first.');
    }
    const branchId = branchResult.rows[0].id;

    let created = 0;
    let skipped = 0;

    for (const v of sampleVehicles) {
      const existing = await client.query(
        'SELECT id FROM vehicles WHERE vehicle_number = $1 OR registration_number = $2 LIMIT 1',
        [v.vehicle_number, v.registration_number]
      );
      if (existing.rows.length > 0) { skipped++; continue; }

      await client.query(
        `INSERT INTO vehicles
           (vehicle_number, registration_number, vehicle_type, manufacturer, model,
            manufacturing_year, fuel_type, current_mileage, purchase_date, branch_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [v.vehicle_number, v.registration_number, v.vehicle_type, v.manufacturer, v.model,
         v.manufacturing_year, v.fuel_type, v.current_mileage, v.purchase_date, branchId, v.status]
      );
      created++;
    }

    await client.query('COMMIT');
    console.log(`✅ Vehicles seeded: ${created} created, ${skipped} skipped.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Vehicle seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedVehicles().then(async () => {
    await pool.end();
  });
}

module.exports = seedVehicles;
