import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin boundary: authentication is shared with normal users, but every
 * request under /admin must belong to an admin or owner account.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=%2Fadmin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    redirect('/dashboard');
  }

  return children;
}
