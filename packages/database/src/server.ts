/**
 * Server Supabase Client Creator
 * 
 * Usage example:
 * const supabase = createServerClient(cookieStore);
 */

import { createServerClient as createSsrServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

export interface CookieMethods {
  getAll: () => { name: string; value: string }[] | Promise<{ name: string; value: string }[]>;
  setAll?: (
    cookies: {
      name: string;
      value: string;
      options?: CookieOptions;
    }[]
  ) => void | Promise<void>;
}

/**
 * Creates a server-side Supabase client for Server Components, Actions, and Route Handlers.
 */
export function createServerClient<Database = Record<string, never>>(
  cookieMethods: CookieMethods
): SupabaseClient<Database> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createSsrServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieMethods.getAll();
      },
      setAll(cookiesToSet) {
        if (cookieMethods.setAll) {
          cookieMethods.setAll(cookiesToSet);
        }
      },
    },
  });
}
