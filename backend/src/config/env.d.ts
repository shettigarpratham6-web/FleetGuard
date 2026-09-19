interface EnvConfig {
  PORT: string | number;
  NODE_ENV: string;
  JWT_SECRET: string;
  DATABASE_URL?: string;
  DB_SSL: boolean;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_HOST?: string;
  DB_PORT?: string | number;
  DB_DATABASE?: string;
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
}

const env: EnvConfig;
export default env;
