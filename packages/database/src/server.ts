/**
 * Server Supabase Client Creator
 *
 * Usage example:
 * const supabase = createServerClient(cookieStore);
 */

import { createServerClient as createSsrServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';
import type { Database } from './types';

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
export function createServerClient<T = Database>(cookieMethods: CookieMethods): SupabaseClient<T> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createSsrServerClient<T>(supabaseUrl, supabaseAnonKey, {
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
