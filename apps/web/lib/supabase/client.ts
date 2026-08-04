/**
 * Web Application Supabase Browser Client
 * 
 * Usage example:
 * const supabase = createClient();
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getWebSupabaseEnv } from './env';

/**
 * Creates a browser-side Supabase client for Next.js Client Components.
 */
export function createClient<Database = Record<string, never>>(): SupabaseClient<Database> {
  const { supabaseUrl, supabaseAnonKey } = getWebSupabaseEnv();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
