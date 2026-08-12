'use server';

import { createServiceClient } from '@ai-visibility-os/database';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase server configuration is missing.');
  return createServiceClient(key);
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'owner'].includes(profile.role)) throw new Error('Admin access required.');
  return user;
}

export async function saveProvider(input: {
  id?: string;
  slug: string;
  displayName: string;
  adapter: 'gemini' | 'openai_compatible';
  primaryModel: string;
  fallbackModels: string[];
  baseUrl?: string;
  apiKey?: string;
  isActive: boolean;
  isDefault: boolean;
}) {
  await requireAdmin();
  const db = getServiceClient() as any;
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (!slug || !input.displayName.trim() || !input.primaryModel.trim()) {
    throw new Error('Name, slug, and primary model are required.');
  }

  if (input.isDefault) {
    await db.from('providers').update({ is_default: false }).neq('slug', slug);
  }

  const payload = {
    slug,
    display_name: input.displayName.trim(),
    adapter: input.adapter,
    primary_model: input.primaryModel.trim(),
    fallback_models: input.fallbackModels.filter(Boolean),
    base_url: input.baseUrl?.trim() || null,
    is_active: input.isActive,
    is_default: input.isDefault,
    updated_at: new Date().toISOString(),
  };

  let providerId = input.id;
  if (providerId) {
    const { error } = await db.from('providers').update(payload).eq('id', providerId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await db.from('providers').insert(payload).select('id').single();
    if (error) throw new Error(error.message);
    providerId = data.id;
  }

  if (input.apiKey?.trim()) {
    const { error } = await db.from('provider_secrets').upsert({
      provider_id: providerId,
      api_key: input.apiKey.trim(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function toggleProvider(id: string, isActive: boolean) {
  await requireAdmin();
  const db = getServiceClient() as any;
  const { error } = await db.from('providers').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/providers');
  return { success: true };
}
