export interface WebSupabaseEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Validates and retrieves Supabase environment variables for the Next.js application.
 */
export function getWebSupabaseEnv(): WebSupabaseEnv {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return { supabaseUrl, supabaseAnonKey };
}
