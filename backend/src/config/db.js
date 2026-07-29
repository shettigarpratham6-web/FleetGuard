const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const useSSL = process.env.DB_SSL === 'true' || isProduction || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
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
