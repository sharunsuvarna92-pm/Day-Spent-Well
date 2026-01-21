
import { createClient } from '@supabase/supabase-js';

/**
 * MARK: Supabase SDK Initialization
 * Using the provided project URL and publishable API key.
 */
const SUPABASE_URL = 'https://kcijpnrorgcsteetsvnl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_plWzLs0cqoMz3lo7p8mQNQ_xfLAbEPi';

// Initialize the client.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
