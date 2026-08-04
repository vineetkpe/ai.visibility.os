/**
 * Browser Supabase Client Creator
 * 
 * Usage example:
 * const supabase = createBrowserClient();
 */

import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

/**
 * Creates a browser-side Supabase client for Client Components using @supabase/ssr.
 */
export function createBrowserClient<Database = Record<string, never>>(): SupabaseClient<Database> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createSsrBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
