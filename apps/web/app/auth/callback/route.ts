import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectUrl } from '@/proxy';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || searchParams.get('redirect');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = sanitizeRedirectUrl(next, '/dashboard');
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Return user to login page with error state if code exchange failed
  return NextResponse.redirect(`${origin}/login?error=Could+not+authenticate+user`);
}
