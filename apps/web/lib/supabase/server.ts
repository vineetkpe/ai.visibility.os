/**
 * Web Application Supabase Server Client
 *
 * Usage example:
 * const supabase = await createClient();
 */

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseEnv, type Database } from '@ai-visibility-os/database';

/**
 * Creates a server-side Supabase client for Next.js Server Components, Actions, and Route Handlers.
 */
export async function createClient<T = Database>(): Promise<SupabaseClient<T>> {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createServerClient<T>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be safely ignored when proxy/middleware refreshes user sessions.
        }
      },
    },
  });
}
