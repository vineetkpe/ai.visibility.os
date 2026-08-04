/**
 * Web Application Supabase Browser Client
 * 
 * Usage example:
 * const supabase = createClient();
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '@ai-visibility-os/database';

/**
 * Creates a browser-side Supabase client for Next.js Client Components.
 */
export function createClient<Database = Record<string, never>>(): SupabaseClient<Database> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
