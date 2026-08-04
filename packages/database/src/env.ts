export interface SupabaseEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Validates and retrieves Supabase environment variables.
 * Falls back safely or throws an explicit descriptive error if missing.
 */
export function getSupabaseEnv(): SupabaseEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL is required.'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY is required.'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}
