const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env or root env files
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env.local'),
  path.resolve(__dirname, '../../../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
}

const isProduction = process.env.NODE_ENV === 'production';
const useSSL = process.env.DB_SSL === 'true' || isProduction || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase'));

let connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.DB_HOST && process.env.DB_USER) {
  const user = encodeURIComponent(process.env.DB_USER);
  const password = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : '';
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || 5432;
  const dbName = process.env.DB_DATABASE || 'postgres';
  connectionString = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
}

if (!connectionString) {
  throw new Error('Database connection configuration missing: Please check your .env file for DATABASE_URL or DB_HOST/DB_USER credentials.');
}

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database successfully.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
