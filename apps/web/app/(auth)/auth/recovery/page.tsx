'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function RecoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/reset-password';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeNext = useMemo(
    () => (next.startsWith('/') && !next.startsWith('//') && !next.includes(':') ? next : '/reset-password'),
    [next]
  );

  async function handleContinue() {
    if (!tokenHash || type !== 'recovery') {
      setError('This password reset link is invalid or incomplete. Please request a new one.');
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });

    if (verifyError) {
      setError(verifyError.message || 'This password reset link is invalid or has expired.');
      toast.error(verifyError.message || 'Password reset link is invalid or expired.');
      setLoading(false);
      return;
    }

    router.replace(safeNext);
    router.refresh();
  }

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Continue password reset</CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Click below to securely continue. This extra step prevents email security scanners from consuming your one-time reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-600">
            {error}
          </div>
        )}
        <Button type="button" className="w-full text-xs gap-2" onClick={handleContinue} disabled={loading}>
          <KeyRound className="h-4 w-4" />
          {loading ? 'Verifying link...' : 'Continue to reset password'}
        </Button>
      </CardContent>
    </Card>
  );
}
