const { pool } = require('./db');

const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('Initializing database schema...');
    await client.query('BEGIN');

    // 0. Enable pgcrypto extension
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    // 0b. Create roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT
      );
    `);

    // 1. Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid VARCHAR(128) UNIQUE,
        username VARCHAR(50) UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        phone_number VARCHAR(20),
        role VARCHAR(20) DEFAULT 'Driver' CHECK (role IN ('Admin','Fleet Manager','Driver','Service Center', 'Manager', 'User')),
        profile_picture TEXT,
        branch_id UUID,
        status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Ensure all required columns exist on the users table if it pre-existed
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
      ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
    `);

    // Update existing users to have full_name if null
    await client.query(`
      UPDATE users SET full_name = COALESCE(full_name, username, split_part(email, '@', 1), 'User') WHERE full_name IS NULL;
    `);

    // Set full_name to NOT NULL now that it is populated
    await client.query(`
      ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;
    `);

    await client.query(`
      ALTER TABLE users ALTER COLUMN password_hash TYPE TEXT;
      ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    // Drop and recreate role and status check constraints
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
    `);

    await client.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Admin','Fleet Manager','Driver','Service Center', 'Manager', 'User'));
      ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('Active','Inactive'));
    `);

    // 2. Create branches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_name VARCHAR(100) NOT NULL,
        city VARCHAR(100),
        manager_name VARCHAR(100),
        phone_number VARCHAR(20),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      ALTER TABLE vehicles
      DROP CONSTRAINT IF EXISTS check_vehicle_mileage;
      ALTER TABLE vehicles
      ADD CONSTRAINT check_vehicle_mileage
      CHECK (current_mileage >= 0);
     `);
    // 3. Create vehicles table (with NOT NULL branch_id and all constraints)
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_number VARCHAR(30) UNIQUE NOT NULL,
        registration_number VARCHAR(50) UNIQUE NOT NULL,
        vehicle_type VARCHAR(50),
        manufacturer VARCHAR(50),
        model VARCHAR(50),
        manufacturing_year INTEGER,
        fuel_type VARCHAR(20),
        current_mileage INTEGER DEFAULT 0,
        purchase_date DATE,
        branch_id UUID NOT NULL REFERENCES branches(id),
        status VARCHAR(30) DEFAULT 'Available'
          CHECK (
            status IN (
              'Available',
              'Assigned',
              'Maintenance',
              'Inactive'
            )
          ),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT check_vehicle_mileage
          CHECK (current_mileage >= 0),
        CONSTRAINT check_manufacturing_year
          CHECK (
            manufacturing_year IS NULL
            OR manufacturing_year BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
          )
      );
    `);

    // 4. Create compliance_documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID NOT NULL
          REFERENCES vehicles(id)
          ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL
          CHECK (
            document_type IN (
              'Insurance',
              'Inspection',
              'PUC',
              'Fitness Certificate'
            )
          ),
        document_number VARCHAR(100),
        issue_date DATE,
        expiry_date DATE NOT NULL,
        file_url TEXT,
        status VARCHAR(20) DEFAULT 'Valid'
          CHECK (
            status IN (
              'Valid',
              'Expired',
              'Pending'
            )
          ),
        uploaded_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT check_document_dates
          CHECK (
            issue_date IS NULL
            OR expiry_date >= issue_date
          )
      );
    `);

    // 4b. Create service_records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        mechanic_id UUID REFERENCES users(id) ON DELETE SET NULL,
        service_date DATE NOT NULL,
        current_mileage INTEGER NOT NULL CHECK (current_mileage >= 0),
        service_type VARCHAR(100) NOT NULL,
        description TEXT,
        parts_changed TEXT,
        labour_cost NUMERIC(10,2) DEFAULT 0 CHECK (labour_cost >= 0),
        parts_cost NUMERIC(10,2) DEFAULT 0 CHECK (parts_cost >= 0),
        total_cost NUMERIC(10,2) GENERATED ALWAYS AS (labour_cost + parts_cost) STORED,
        invoice_url TEXT,
        next_service_mileage INTEGER CHECK (next_service_mileage >= current_mileage),
        next_service_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4c. Create historical_services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS historical_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        service_date DATE NOT NULL,
        mileage INTEGER CHECK (mileage >= 0),
        description TEXT,
        entered_by UUID REFERENCES users(id) ON DELETE SET NULL,
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4d. Create maintenance_risks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance_risks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID UNIQUE NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        current_mileage INTEGER NOT NULL,
        last_service_mileage INTEGER NOT NULL,
        recommended_interval INTEGER NOT NULL,
        remaining_distance INTEGER,
        risk_level VARCHAR(20) CHECK (risk_level IN ('Low', 'Medium', 'High')),
        summary TEXT,
        last_updated TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4e. Create override_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS override_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id),
        manager_id UUID REFERENCES users(id),
        reason TEXT NOT NULL,
        approval_status VARCHAR(30) DEFAULT 'Approved' CHECK (
          approval_status IN (
            'Approved',
            'Rejected',
            'Pending'
          )
        ),
        approved_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4f. Create assignments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        driver_id UUID REFERENCES users(id),
        assigned_by UUID REFERENCES users(id),
        assigned_date TIMESTAMPTZ DEFAULT NOW(),
        return_date TIMESTAMPTZ,
        assignment_status VARCHAR(30) DEFAULT 'Active' CHECK (
          assignment_status IN (
            'Active',
            'Completed',
            'Cancelled'
          )
        ),
        override_used BOOLEAN DEFAULT FALSE,
        override_log_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4g. Create checklists table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checklists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id),
        driver_id UUID REFERENCES users(id),
        checklist_date DATE DEFAULT CURRENT_DATE,
        tyres_ok BOOLEAN,
        brakes_ok BOOLEAN,
        lights_ok BOOLEAN,
        horn_ok BOOLEAN,
        mirrors_ok BOOLEAN,
        remarks TEXT,
        status VARCHAR(20) DEFAULT 'Completed'
      );
    `);

    // 4h. Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_vehicles_branch_id ON vehicles(branch_id);
      CREATE INDEX IF NOT EXISTS idx_compliance_vehicle_id ON compliance_documents(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_compliance_expiry_date ON compliance_documents(expiry_date);
      CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_id ON service_records(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_historical_services_vehicle_id ON historical_services(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_vehicle ON notifications(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_vehicle ON assignments(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_driver ON assignments(driver_id);
      CREATE INDEX IF NOT EXISTS idx_checklists_vehicle ON checklists(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_override_logs_vehicle ON override_logs(vehicle_id);
    `);

    // 6. Create trigger and function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_vehicle_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS vehicles_updated_at ON vehicles;
    `);

    await client.query(`
      CREATE TRIGGER vehicles_updated_at
      BEFORE UPDATE ON vehicles
      FOR EACH ROW
      EXECUTE FUNCTION update_vehicle_timestamp();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS service_records_updated_at ON service_records;
    `);

    await client.query(`
      CREATE TRIGGER service_records_updated_at
      BEFORE UPDATE ON service_records
      FOR EACH ROW
      EXECUTE FUNCTION update_vehicle_timestamp();
    `);

    await client.query('COMMIT');
    console.log('Database initialization completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = initDb;
