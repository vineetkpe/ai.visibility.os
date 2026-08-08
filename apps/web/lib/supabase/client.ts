/**
 * Web Application Supabase Browser Client
 *
 * Usage example:
 * const supabase = createClient();
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv, type Database } from '@ai-visibility-os/database';

/**
 * Creates a browser-side Supabase client for Next.js Client Components.
 */
export function createClient<T = Database>(): SupabaseClient<T> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createBrowserClient<T>(supabaseUrl, supabaseAnonKey);
}
