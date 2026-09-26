import dotenv from 'dotenv';

dotenv.config();

const requiredEnv: string[] = [
  'DATABASE_URL',
  'JWT_SECRET'
];

const missingEnv: string[] = requiredEnv.filter((envName) => !process.env[envName]);

if (missingEnv.length > 0) {
  console.warn(`⚠️ Warning: Missing required environment variables: ${missingEnv.join(', ')}`);
}

export const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretkeyreplaceinproduction',
  DATABASE_URL: process.env.DATABASE_URL,
  DB_SSL: process.env.DB_SSL === 'true',
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_DATABASE: process.env.DB_DATABASE,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
};

export default config;
