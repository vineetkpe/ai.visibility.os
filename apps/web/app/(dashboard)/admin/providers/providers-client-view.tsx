'use client';

import { useState } from 'react';
import { Plus, KeyRound, Power, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { saveProvider, toggleProvider } from './actions';

type Provider = {
  id: string;
  slug: string;
  display_name: string;
  is_active: boolean;
  adapter: 'gemini' | 'openai_compatible';
  primary_model: string | null;
  fallback_models: string[];
  base_url: string | null;
  is_default: boolean;
};

export function ProvidersClientView({ providers }: { providers: Provider[] }) {
  const [editing, setEditing] = useState<Provider | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>AI Engine Registry</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Add an engine once, store its API connection, choose its model, and switch it on without touching code.</p>
          </div>
          <Button onClick={() => { setEditing(null); setAdding(true); }}><Plus className="mr-2 h-4 w-4" /> Add AI Engine</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {providers.map((provider) => (
            <div key={provider.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{provider.display_name}</span>
                  {provider.is_default && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"><Star className="h-3 w-3" /> Default</span>}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${provider.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{provider.is_active ? 'Active' : 'Disabled'}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">{provider.slug} · {provider.adapter} · {provider.primary_model || 'No model configured'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditing(provider); setAdding(false); }}>Configure</Button>
                <Button variant="ghost" size="sm" onClick={async () => toggleProvider(provider.id, !provider.is_active)}><Power className="mr-2 h-4 w-4" /> {provider.is_active ? 'Disable' : 'Enable'}</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {(adding || editing) && (
        <ProviderForm provider={editing} onClose={() => { setAdding(false); setEditing(null); }} />
      )}
    </div>
  );
}

type ProviderFormState = {
  slug: string;
  displayName: string;
  adapter: 'gemini' | 'openai_compatible';
  primaryModel: string;
  fallbackModels: string;
  baseUrl: string;
  apiKey: string;
  isActive: boolean;
  isDefault: boolean;
};

function ProviderForm({ provider, onClose }: { provider: Provider | null; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProviderFormState>({
    slug: provider?.slug || '',
    displayName: provider?.display_name || '',
    adapter: provider?.adapter ?? 'gemini',
    primaryModel: provider?.primary_model || '',
    fallbackModels: provider?.fallback_models?.join(', ') || '',
    baseUrl: provider?.base_url || '',
    apiKey: '',
    isActive: provider?.is_active ?? true,
    isDefault: provider?.is_default ?? false,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProvider({
        id: provider?.id,
        ...form,
        adapter: form.adapter,
        fallbackModels: form.fallbackModels.split(',').map((v) => v.trim()).filter(Boolean),
      });
      window.location.reload();
    } finally { setSaving(false); }
  }

  return (
    <Card>
      <CardHeader><CardTitle>{provider ? 'Configure AI Engine' : 'Add AI Engine'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Display name<Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Gemini" /></label>
          <label className="text-sm font-medium">Slug<Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="gemini" disabled={!!provider} /></label>
          <label className="text-sm font-medium">Adapter<select className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={form.adapter} onChange={(e) => setForm({ ...form, adapter: e.target.value as ProviderFormState['adapter'] })}><option value="gemini">Google Gemini</option><option value="openai_compatible">OpenAI-compatible API</option></select></label>
          <label className="text-sm font-medium">Primary model<Input value={form.primaryModel} onChange={(e) => setForm({ ...form, primaryModel: e.target.value })} placeholder="gemini-flash-latest" /></label>
          <label className="text-sm font-medium md:col-span-2">Fallback models<Input value={form.fallbackModels} onChange={(e) => setForm({ ...form, fallbackModels: e.target.value })} placeholder="model-a, model-b" /></label>
          <label className="text-sm font-medium md:col-span-2">API base URL <span className="font-normal text-slate-400">(optional for Gemini)</span><Input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.example.com/v1" /></label>
          <label className="text-sm font-medium md:col-span-2">API key {provider && <span className="font-normal text-slate-400">(leave blank to keep current key)</span>}<div className="relative"><KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder={provider ? '••••••••••••••••' : 'Paste API key'} autoComplete="new-password" /></div></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Enabled for scans</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> Default scan engine</label>
          <div className="md:col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save engine'}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
