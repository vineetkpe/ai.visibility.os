/**
 * Web Application Supabase Server Client
 * 
 * Usage example:
 * const supabase = await createClient();
 */

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getWebSupabaseEnv } from './env';

/**
 * Creates a server-side Supabase client for Next.js Server Components, Actions, and Route Handlers.
 */
export async function createClient<Database = Record<string, never>>(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getWebSupabaseEnv();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be safely ignored when proxy/middleware refreshes user sessions.
        }
      },
    },
  });
}
