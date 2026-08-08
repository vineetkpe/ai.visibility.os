import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv, hasSupabaseEnv } from '@ai-visibility-os/database';

/**
 * Validates a redirect target URL to prevent open-redirect vulnerabilities.
 * Ensures the target is an absolute path starting with a single '/' and no external protocol.
 */
export function sanitizeRedirectUrl(url: string | null, fallback = '/dashboard'): string {
  if (!url) return fallback;
  // Allow relative paths starting with '/', excluding protocol-relative '//' and scheme URIs
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes(':')) {
    return url;
  }
  return fallback;
}

const PROTECTED_PREFIXES = ['/dashboard', '/projects', '/settings', '/billing', '/onboarding'];
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

/**
 * Refreshes the Supabase auth session cookie on incoming network requests
 * and enforces route protection and redirects.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Bypass session handling if Supabase environment variables are missing
  if (!hasSupabaseEnv()) {
    return response;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Get user session (handles expired session gracefully)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 0. Root path handling: Exact match '/'
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 1. Route protection: Unauthenticated user accessing protected route
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedRoute && !user) {
    const rawPath = pathname + request.nextUrl.search;
    const redirectPath = encodeURIComponent(rawPath);
    const loginUrl = new URL(`/login?redirect=${redirectPath}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Auth page bypass: Authenticated user accessing auth routes
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && user) {
    const rawRedirect = request.nextUrl.searchParams.get('redirect');
    const targetUrl = new URL(sanitizeRedirectUrl(rawRedirect), request.url);
    return NextResponse.redirect(targetUrl);
  }

  return response;
}

/**
 * Next.js 16 Proxy handler export (export as `proxy`, NOT `middleware`).
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
