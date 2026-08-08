export interface SupabaseEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Checks whether Supabase environment variables are present in the environment.
 */
export function hasSupabaseEnv(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

/**
 * Validates and retrieves Supabase environment variables.
 * Throws an explicit descriptive error if missing at point of use.
 */
export function getSupabaseEnv(): SupabaseEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL is required.');
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY is required.');
  }

  return { supabaseUrl, supabaseAnonKey };
}
