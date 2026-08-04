'use client';

import { createClient } from '@/lib/supabase/client';

export interface AuthState {
  error?: string;
  success?: string;
  loading?: boolean;
}

/**
 * Initiates Google OAuth Sign-In flow from client component.
 */
export async function signInWithGoogle(redirectPath?: string) {
  const supabase = createClient();
  const origin = window.location.origin;
  const target = redirectPath ? encodeURIComponent(redirectPath) : '/dashboard';

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=${target}`,
    },
  });

  if (error) {
    throw error;
  }
}
