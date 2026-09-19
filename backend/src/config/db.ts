import { Pool, QueryResult, QueryResultRow } from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from backend/.env or root env files
const envPaths: string[] = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env.local'),
  path.resolve(__dirname, '../../../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const isProduction: boolean = process.env.NODE_ENV === 'production';
const useSSL: boolean =
  process.env.DB_SSL === 'true' ||
  isProduction ||
  Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase'));

let connectionString: string | undefined = process.env.DATABASE_URL;

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

export const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database successfully.');
});

pool.on('error', (err: Error) => {
  console.error('⚠️ Database pool background error:', err.message || err);
});

export const query = <R extends QueryResultRow = any, I extends any[] = any[]>(
  text: string,
  params?: I
): Promise<QueryResult<R>> => pool.query<R, I>(text, params);

export default {
  query,
  pool
};
