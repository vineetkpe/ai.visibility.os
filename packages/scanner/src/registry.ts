import type { AIVisibilityProvider } from './providers/interface';
import { GeminiProvider } from './providers/gemini';
import { OpenAICompatibleProvider } from './providers/openai-compatible';
import { createServiceClient } from '@ai-visibility-os/database';
import type { GroundedQueryResult, ScanAnalysisResult, GroundingCitation } from './types';

export interface ProviderCapabilities { searchGrounded: boolean; structuredOutput: boolean; supportedModels: string[]; }
export interface ProviderConfig { slug: string; displayName: string; isActive: boolean; primaryModel: string; fallbackModels: string[]; capabilities: ProviderCapabilities; }

const GEMINI_PRIMARY_MODEL = 'gemini-flash-latest';
const GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash-lite'];

export const DEFAULT_PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  gemini: { slug: 'gemini', displayName: 'Google Gemini', isActive: true, primaryModel: GEMINI_PRIMARY_MODEL, fallbackModels: GEMINI_FALLBACK_MODELS, capabilities: { searchGrounded: true, structuredOutput: true, supportedModels: [GEMINI_PRIMARY_MODEL, ...GEMINI_FALLBACK_MODELS] } },
  chatgpt: { slug: 'chatgpt', displayName: 'ChatGPT', isActive: false, primaryModel: 'gpt-4o', fallbackModels: ['gpt-4o-mini'], capabilities: { searchGrounded: false, structuredOutput: true, supportedModels: ['gpt-4o', 'gpt-4o-mini'] } },
  claude: { slug: 'claude', displayName: 'Claude', isActive: false, primaryModel: 'claude-3-5-sonnet', fallbackModels: ['claude-3-5-haiku'], capabilities: { searchGrounded: false, structuredOutput: true, supportedModels: ['claude-3-5-sonnet', 'claude-3-5-haiku'] } },
  perplexity: { slug: 'perplexity', displayName: 'Perplexity', isActive: false, primaryModel: 'sonar-pro', fallbackModels: ['sonar'], capabilities: { searchGrounded: true, structuredOutput: true, supportedModels: ['sonar-pro', 'sonar'] } },
};

type ConfiguredProviderRow = { id: string; slug: string; display_name: string; adapter: string; primary_model: string | null; fallback_models: string[] | null; base_url: string | null; is_active: boolean; is_default: boolean; };

async function loadConfiguredProvider(slug: string): Promise<AIVisibilityProvider> {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!secret || !supabaseUrl) throw new Error('Supabase worker configuration is missing.');

  const db = createServiceClient(secret);
  const { data: config, error } = await db
    .from('providers')
    .select('id,slug,display_name,adapter,primary_model,fallback_models,base_url,is_active,is_default')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load AI engine configuration: ${error.message}`);
  if (!config) throw new Error(`No active AI engine is configured for '${slug}'. Open Admin → AI Engines.`);

  const row = config as ConfiguredProviderRow;
  const { data: secretRow, error: secretError } = await db
    .from('provider_secrets')
    .select('api_key')
    .eq('provider_id', row.id)
    .maybeSingle();

  if (secretError || !secretRow?.api_key) {
    throw new Error(`API key is not configured for AI engine '${row.display_name}'. Configure it in Admin → AI Engines.`);
  }

  const primaryModel = row.primary_model || DEFAULT_PROVIDER_CONFIGS[row.slug]?.primaryModel || 'gpt-4o-mini';
  const fallbackModels = Array.isArray(row.fallback_models) ? row.fallback_models : [];

  if (row.adapter === 'openai_compatible') {
    return new OpenAICompatibleProvider({ apiKey: secretRow.api_key, primaryModel, baseUrl: row.base_url || undefined, providerName: row.display_name });
  }
  if (row.adapter === 'gemini') {
    return new GeminiProvider({ apiKey: secretRow.api_key, primaryModel, fallbackModels });
  }
  throw new Error(`Unsupported adapter '${row.adapter}' for AI engine '${row.display_name}'.`);
}

class ConfiguredProvider implements AIVisibilityProvider {
  readonly providerName: string;
  readonly modelName: string;
  private readonly slug: string;
  private resolved?: Promise<AIVisibilityProvider>;

  constructor(slug: string) {
    this.slug = slug;
    this.providerName = slug;
    this.modelName = DEFAULT_PROVIDER_CONFIGS[slug]?.primaryModel || 'configured';
  }

  private resolve() {
    this.resolved ??= loadConfiguredProvider(this.slug);
    return this.resolved;
  }

  async runGroundedQuery(promptText: string): Promise<GroundedQueryResult> {
    return (await this.resolve()).runGroundedQuery(promptText);
  }

  async analyzeResponse(promptText: string, rawText: string, citations: GroundingCitation[], targetDomainName: string): Promise<ScanAnalysisResult> {
    return (await this.resolve()).analyzeResponse(promptText, rawText, citations, targetDomainName);
  }
}

export function getProvider(slug: string, options?: { apiKey?: string; primaryModel?: string; fallbackModels?: string[]; adapter?: string; baseUrl?: string; displayName?: string }): AIVisibilityProvider {
  const normalizedSlug = slug.toLowerCase().trim();
  if (!options) return new ConfiguredProvider(normalizedSlug);

  const primaryModel = options.primaryModel || DEFAULT_PROVIDER_CONFIGS[normalizedSlug]?.primaryModel || 'gpt-4o-mini';
  const fallbackModels = options.fallbackModels || DEFAULT_PROVIDER_CONFIGS[normalizedSlug]?.fallbackModels || [];
  const adapter = options.adapter || (normalizedSlug === 'gemini' ? 'gemini' : 'openai_compatible');

  if (adapter === 'openai_compatible') {
    if (!options.apiKey) throw new Error(`API key is not configured for provider '${slug}'.`);
    return new OpenAICompatibleProvider({ apiKey: options.apiKey, primaryModel, baseUrl: options.baseUrl, providerName: options.displayName || slug });
  }
  if (normalizedSlug === 'gemini') return new GeminiProvider({ apiKey: options.apiKey, primaryModel, fallbackModels });
  throw new Error(`Unsupported provider '${slug}' for adapter '${adapter}'.`);
}
