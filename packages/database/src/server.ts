/**
 * Server Supabase Client Creator
 *
 * Usage example:
 * const supabase = createServerClient(cookieStore);
 */

import { createServerClient as createSsrServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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

export function createServerClient<T = Database>(cookieMethods: CookieMethods): SupabaseClient<T> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createSsrServerClient<T>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieMethods.getAll(); },
      setAll(cookiesToSet) {
        if (cookieMethods.setAll) cookieMethods.setAll(cookiesToSet);
      },
    },
  });
}

export function createTokenClient<T = Database>(accessToken: string): SupabaseClient<T> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createClient<T>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Creates a trusted server-side client using a modern Supabase secret API key. */
export function createServiceClient<T = Database>(secretKey: string): SupabaseClient<T> {
  const { supabaseUrl } = getSupabaseEnv();

  return createClient<T>(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
