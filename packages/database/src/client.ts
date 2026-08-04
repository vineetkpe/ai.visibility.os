/**
 * Browser Supabase Client Creator
 * 
 * Usage example:
 * const supabase = createBrowserClient();
 */

import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';
import type { Database } from './types';

/**
 * Creates a browser-side Supabase client for Client Components using @supabase/ssr.
 */
export function createBrowserClient<T = Database>(): SupabaseClient<T> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createSsrBrowserClient<T>(supabaseUrl, supabaseAnonKey);
}
