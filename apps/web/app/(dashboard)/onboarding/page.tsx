import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=%2Fonboarding');
  }

  // Check if user already has at least one active project
  const { data: existingProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .limit(1);

  if (existingProjects && existingProjects.length > 0) {
    redirect('/dashboard');
  }

  return <OnboardingWizard userEmail={user.email ?? ''} />;
}
