import type { AIVisibilityProvider } from './providers/interface';
import { GeminiProvider } from './providers/gemini';
import { OpenAICompatibleProvider } from './providers/openai-compatible';
import { ChatGPTProvider, ClaudeProvider, PerplexityProvider, DeepSeekProvider, GrokProvider } from './providers/stubs';

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

export function getProvider(slug: string, options?: { apiKey?: string; primaryModel?: string; fallbackModels?: string[]; adapter?: string; baseUrl?: string; displayName?: string }): AIVisibilityProvider {
  const normalizedSlug = slug.toLowerCase().trim();
  const primaryModel = options?.primaryModel || DEFAULT_PROVIDER_CONFIGS[normalizedSlug]?.primaryModel || 'gpt-4o-mini';
  const fallbackModels = options?.fallbackModels || DEFAULT_PROVIDER_CONFIGS[normalizedSlug]?.fallbackModels || [];
  const adapter = options?.adapter || (normalizedSlug === 'gemini' ? 'gemini' : 'openai_compatible');

  if (adapter === 'openai_compatible') {
    if (!options?.apiKey) throw new Error(`API key is not configured for provider '${slug}'.`);
    return new OpenAICompatibleProvider({ apiKey: options.apiKey, primaryModel, baseUrl: options.baseUrl, providerName: options.displayName || slug });
  }

  switch (normalizedSlug) {
    case 'gemini':
    case 'google-gemini':
      return new GeminiProvider({ apiKey: options?.apiKey, primaryModel, fallbackModels });
    case 'chatgpt':
    case 'openai':
    case 'openai-chatgpt': return new ChatGPTProvider();
    case 'claude':
    case 'anthropic':
    case 'anthropic-claude': return new ClaudeProvider();
    case 'perplexity':
    case 'perplexity-ai': return new PerplexityProvider();
    case 'deepseek': return new DeepSeekProvider();
    case 'grok': return new GrokProvider();
    default: throw new Error(`Unsupported AI engine provider: '${slug}'.`);
  }
}
