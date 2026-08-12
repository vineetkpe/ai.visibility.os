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

type ConfiguredProviderRow = {
  slug: string;
  display_name: string;
  adapter: string;
  primary_model: string | null;
  fallback_models: string[] | null;
  base_url: string | null;
  is_active: boolean;
  is_default: boolean;
};

async function loadConfiguredProvider(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('Supabase worker configuration is missing.');
  const db = createServiceClient(secret) as any;
  const { data: row, error } = await db.from('providers').select('slug,display_name,adapter,primary_model,fallback_models,base_url,is_active,is_default').eq('slug', slug).maybeSingle();
  if (error) throw new Error(`Failed to load AI engine configuration: ${error.message}`);
  const config = row as ConfiguredProviderRow | null;
  if (!config || !config.is_active) throw new Error(`AI engine '${slug}' is not active. Enable it in Admin → AI Engines.`);
  const { data: secretRow, error: secretError } = await db.from('provider_secrets').select('api_key').eq('provider_id', (await db.from('providers').select('id').eq('slug', slug).single()).data.id).maybeSingle();
  if (secretError || !secretRow?.api_key) throw new Error(`API key is not configured for AI engine '${config.display_name}'. Configure it in Admin → AI Engines.`);

  const primaryModel = config.primary_model || DEFAULT_PROVIDER_CONFIGS[slug]?.primaryModel || 'gpt-4o-mini';
  const fallbackModels = Array.isArray(config.fallback_models) ? config.fallback_models : [];
  if (config.adapter === 'openai_compatible') {
    return new OpenAICompatibleProvider({ apiKey: secretRow.api_key, primaryModel, baseUrl: config.base_url || undefined, providerName: config.display_name });
  }
  if (config.adapter === 'gemini') {
    return new GeminiProvider({ apiKey: secretRow.api_key, primaryModel, fallbackModels });
  }
  throw new Error(`Unsupported adapter '${config.adapter}' for AI engine '${config.display_name}'.`);
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
    return new OpenAICompatibleProvider({ apiKey: options.apiKey, primaryModel, fallbackModels: undefined as never, baseUrl: options.baseUrl, providerName: options.displayName || slug });
  }
  if (normalizedSlug === 'gemini') return new GeminiProvider({ apiKey: options.apiKey, primaryModel, fallbackModels });
  throw new Error(`Unsupported provider '${slug}' for adapter '${adapter}'.`);
}
