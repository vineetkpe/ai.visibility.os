'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        toast.error(resetError.message);
        setLoading(false);
        return;
      }

      toast.success('Password reset link sent to your email.');

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-slate-200 bg-white shadow-xs text-center p-6 space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-900">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl">Reset Link Sent</CardTitle>
        <CardDescription className="text-xs text-slate-500 max-w-sm mx-auto">
          We have sent a password reset link to <strong>{email}</strong>. Please check your inbox.
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
        <CardTitle className="text-xl">Forgot password?</CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Enter your email address and we will send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className="text-xs font-medium text-slate-700">
              Email address
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
            />
          </div>

          <Button type="submit" className="w-full text-xs gap-2" disabled={loading}>
            <KeyRound className="h-4 w-4" />
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-slate-100 pt-4">
        <Link
          href="/login"
          className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
