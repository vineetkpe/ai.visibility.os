import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectUrl } from '@/proxy';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || searchParams.get('redirect');

  const supabase = await createClient();

  // PKCE flow used by resetPasswordForEmail when the reset email contains
  // a ConfirmationURL with a `code` parameter.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = sanitizeRedirectUrl(next, '/dashboard');
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Supabase can also deliver recovery links as token_hash + type. Support
  // that format as well so password-reset emails never fall back to login.
  if (tokenHash && type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });
    if (!error) {
      const destination = sanitizeRedirectUrl(next, '/reset-password');
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Could+not+authenticate+password+reset+link`
  );
}
