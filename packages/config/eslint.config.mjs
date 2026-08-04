import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export const baseConfig = tseslint.config(
  {
    ignores: ['next-env.d.ts', '.next/**', 'dist/**', 'build/**', 'node_modules/**', '.turbo/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);

export default baseConfig;
