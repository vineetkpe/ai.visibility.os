import type { AIVisibilityProvider } from './providers/interface';
import { GeminiProvider } from './providers/gemini';
import { OpenAICompatibleProvider } from './providers/openai-compatible';
import { createServiceClient } from '@ai-visibility-os/database';
import type { GroundedQueryResult, ScanAnalysisResult, GroundingCitation } from './types';

export interface ProviderCapabilities {
  searchGrounded: boolean;
  structuredOutput: boolean;
  supportedModels: string[];
}

export interface ProviderConfig {
  slug: string;
  displayName: string;
  isActive: boolean;
  primaryModel: string;
  fallbackModels: string[];
  capabilities: ProviderCapabilities;
}

type ConfiguredProviderRow = {
  id: string;
  slug: string;
  display_name: string;
  adapter: string | null;
  primary_model: string | null;
  fallback_models: unknown;
  base_url: string | null;
  is_active: boolean;
  is_default: boolean;
};

const GEMINI_PRIMARY_MODEL = 'gemini-3.6-flash';
const GEMINI_FALLBACK_MODELS = ['gemini-3.5-flash-lite'];

export const DEFAULT_PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  gemini: {
    slug: 'gemini',
    displayName: 'Google Gemini',
    isActive: true,
    primaryModel: GEMINI_PRIMARY_MODEL,
    fallbackModels: GEMINI_FALLBACK_MODELS,
    capabilities: { searchGrounded: true, structuredOutput: true, supportedModels: [GEMINI_PRIMARY_MODEL, ...GEMINI_FALLBACK_MODELS] },
  },
  chatgpt: {
    slug: 'chatgpt', displayName: 'ChatGPT', isActive: false, primaryModel: 'gpt-4o', fallbackModels: ['gpt-4o-mini'],
    capabilities: { searchGrounded: false, structuredOutput: true, supportedModels: ['gpt-4o', 'gpt-4o-mini'] },
  },
  claude: {
    slug: 'claude', displayName: 'Claude', isActive: false, primaryModel: 'claude-3-5-sonnet', fallbackModels: ['claude-3-5-haiku'],
    capabilities: { searchGrounded: false, structuredOutput: true, supportedModels: ['claude-3-5-sonnet', 'claude-3-5-haiku'] },
  },
  perplexity: {
    slug: 'perplexity', displayName: 'Perplexity', isActive: false, primaryModel: 'sonar-pro', fallbackModels: ['sonar'],
    capabilities: { searchGrounded: true, structuredOutput: true, supportedModels: ['sonar-pro', 'sonar'] },
  },
};

function normalizeFallbackModels(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((model): model is string => typeof model === 'string' && model.trim().length > 0).map((model) => model.trim());
}

async function loadConfiguredProvider(slug: string): Promise<AIVisibilityProvider> {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const defaults = DEFAULT_PROVIDER_CONFIGS[slug];

  if (!defaults) throw new Error(`Unsupported AI engine provider '${slug}'.`);
  if (!secret || !supabaseUrl) throw new Error('Supabase service configuration is required to load the active AI provider.');

  const db = createServiceClient(secret);
  const providerQuery = await (db as any).from('providers')
    .select('*')
    .eq('slug', slug)
    .maybeSingle() as { data: ConfiguredProviderRow | null; error: { message: string } | null };

  if (providerQuery.error) throw new Error(`Failed to load provider configuration: ${providerQuery.error.message}`);
  if (!providerQuery.data) throw new Error(`AI engine '${slug}' is not configured.`);

  const config = providerQuery.data;
  if (!config.is_active) throw new Error(`AI engine '${slug}' is currently inactive.`);

  const primaryModel = config.primary_model?.trim() || defaults.primaryModel;
  const fallbackModels = normalizeFallbackModels(config.fallback_models, defaults.fallbackModels);
  const adapter = config.adapter || (slug === 'gemini' ? 'gemini' : 'openai_compatible');

  if (adapter === 'gemini' && slug === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not configured.');
    return new GeminiProvider({ apiKey, primaryModel, fallbackModels });
  }

  if (adapter === 'openai_compatible') {
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error(`API key is not configured for provider '${slug}'.`);
    return new OpenAICompatibleProvider({ apiKey, primaryModel, baseUrl: config.base_url || undefined, providerName: config.display_name || slug });
  }

  throw new Error(`Unsupported provider adapter '${adapter}' for '${slug}'.`);
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

  private resolve() { this.resolved ??= loadConfiguredProvider(this.slug); return this.resolved; }
  async runGroundedQuery(promptText: string): Promise<GroundedQueryResult> { return (await this.resolve()).runGroundedQuery(promptText); }
  async analyzeResponse(promptText: string, rawText: string, citations: GroundingCitation[], targetDomainName: string): Promise<ScanAnalysisResult> {
    return (await this.resolve()).analyzeResponse(promptText, rawText, citations, targetDomainName);
  }
}

export function getProvider(slug: string, options?: {
  apiKey?: string; primaryModel?: string; fallbackModels?: string[]; adapter?: string; baseUrl?: string; displayName?: string;
}): AIVisibilityProvider {
  const normalizedSlug = slug.toLowerCase().trim();
  if (!options) return new ConfiguredProvider(normalizedSlug);

  const primaryModel = options.primaryModel || DEFAULT_PROVIDER_CONFIGS[normalizedSlug]?.primaryModel || 'gpt-4o-mini';
  const fallbackModels = options.fallbackModels || DEFAULT_PROVIDER_CONFIGS[normalizedSlug]?.fallbackModels || [];
  const adapter = options.adapter || (normalizedSlug === 'gemini' ? 'gemini' : 'openai_compatible');

  if (adapter === 'openai_compatible') {
    if (!options.apiKey) throw new Error(`API key is not configured for provider '${slug}'.`);
    return new OpenAICompatibleProvider({ apiKey: options.apiKey, primaryModel, baseUrl: options.baseUrl, providerName: options.displayName || slug });
  }

  if (normalizedSlug === 'gemini') {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error(`API key is not configured for provider '${slug}'.`);
    return new GeminiProvider({ apiKey, primaryModel, fallbackModels });
  }

  throw new Error(`Unsupported provider '${slug}' for adapter '${adapter}'.`);
}
