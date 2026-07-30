const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    '⚠️  Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. ' +
    'Supabase client will not function correctly.'
  );
}

/**
 * Supabase admin client using the Service Role Key.
 * Bypasses Row Level Security (RLS) — use only on the server/backend.
 * Never expose this key to the frontend.
 */
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

module.exports = supabase;
