'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { sanitizeRedirectUrl } from '@/proxy';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OAuthButton } from '@/components/auth/oauth-button';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        toast.error(signUpError.message);
        setLoading(false);
        return;
      }

      toast.success('Account registered successfully!');

      // If user session is established immediately (e.g. email confirmation disabled)
      if (data.session) {
        const destination = sanitizeRedirectUrl(rawRedirect, '/onboarding');
        router.push(destination);
        router.refresh();
      } else {
        setSignedUp(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during registration';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  if (signedUp) {
    return (
      <Card className="border-slate-200 bg-white shadow-xs text-center p-6 space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-900">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl">Registration Successful</CardTitle>
        <CardDescription className="text-xs text-slate-500 max-w-sm mx-auto">
          Please check your email address <strong>{email}</strong> for a confirmation link to complete your account setup.
        </CardDescription>
        <Button asChild variant="outline" className="w-full text-xs mt-4">
          <Link href="/login">Return to Sign In</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Enter your details to register for AI Visibility OS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <OAuthButton redirectPath={rawRedirect || undefined} disabled={loading} />

        <div className="relative flex items-center justify-center">
          <Separator className="w-full" />
          <span className="absolute bg-white px-2 text-[10px] uppercase font-semibold text-slate-400">
            or email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label htmlFor="signup-fullname" className="text-xs font-medium text-slate-700">Full Name</label>
            <input
              id="signup-fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-email" className="text-xs font-medium text-slate-700">Email address</label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-password" className="text-xs font-medium text-slate-700">Password</label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
            />
          </div>

          <Button type="submit" className="w-full text-xs gap-2" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            href={rawRedirect ? `/login?redirect=${encodeURIComponent(rawRedirect)}` : '/login'}
            className="font-semibold text-slate-900 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-xs text-slate-500 text-center">Loading signup...</div>}>
      <SignupForm />
    </Suspense>
  );
}
