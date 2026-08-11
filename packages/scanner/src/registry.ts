import type { AIVisibilityProvider } from './providers/interface';
import { GeminiProvider } from './providers/gemini';
import {
  ChatGPTProvider,
  ClaudeProvider,
  PerplexityProvider,
  DeepSeekProvider,
  GrokProvider,
} from './providers/stubs';

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

const GEMINI_PRIMARY_MODEL = 'gemini-3.6-flash';
const GEMINI_FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];

export const DEFAULT_PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  gemini: {
    slug: 'gemini',
    displayName: 'Google Gemini',
    isActive: true,
    primaryModel: GEMINI_PRIMARY_MODEL,
    fallbackModels: GEMINI_FALLBACK_MODELS,
    capabilities: {
      searchGrounded: true,
      structuredOutput: true,
      supportedModels: [GEMINI_PRIMARY_MODEL, ...GEMINI_FALLBACK_MODELS],
    },
  },
  chatgpt: {
    slug: 'chatgpt',
    displayName: 'ChatGPT (OpenAI)',
    isActive: false,
    primaryModel: 'gpt-4o',
    fallbackModels: ['gpt-4o-mini'],
    capabilities: {
      searchGrounded: true,
      structuredOutput: true,
      supportedModels: ['gpt-4o', 'gpt-4o-mini'],
    },
  },
  claude: {
    slug: 'claude',
    displayName: 'Claude (Anthropic)',
    isActive: false,
    primaryModel: 'claude-3-5-sonnet',
    fallbackModels: ['claude-3-5-haiku'],
    capabilities: {
      searchGrounded: false,
      structuredOutput: true,
      supportedModels: ['claude-3-5-sonnet', 'claude-3-5-haiku'],
    },
  },
  perplexity: {
    slug: 'perplexity',
    displayName: 'Perplexity AI',
    isActive: false,
    primaryModel: 'sonar-pro',
    fallbackModels: ['sonar'],
    capabilities: {
      searchGrounded: true,
      structuredOutput: true,
      supportedModels: ['sonar-pro', 'sonar'],
    },
  },
};

export function getProvider(
  slug: string,
  options?: {
    apiKey?: string;
    primaryModel?: string;
    fallbackModels?: string[];
  }
): AIVisibilityProvider {
  const normalizedSlug = slug.toLowerCase().trim();

  switch (normalizedSlug) {
    case 'gemini':
    case 'google-gemini':
      return new GeminiProvider({
        apiKey: options?.apiKey,
        primaryModel: options?.primaryModel || GEMINI_PRIMARY_MODEL,
        fallbackModels: options?.fallbackModels || GEMINI_FALLBACK_MODELS,
      });
    case 'chatgpt':
    case 'openai':
    case 'openai-chatgpt':
      return new ChatGPTProvider();
    case 'claude':
    case 'anthropic':
    case 'anthropic-claude':
      return new ClaudeProvider();
    case 'perplexity':
    case 'perplexity-ai':
      return new PerplexityProvider();
    case 'deepseek':
      return new DeepSeekProvider();
    case 'grok':
      return new GrokProvider();
    default:
      throw new Error(`Unsupported AI engine provider: '${slug}'.`);
  }
}
