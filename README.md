# AI Visibility OS

A production-ready Turborepo monorepo for the **AI Visibility OS** SaaS platform.

## Architecture & Directory Structure

```text
ai-visibility-os/
├── apps/
│   └── web/            # Next.js 16 App Router application
├── packages/
│   ├── config/         # Shared TypeScript and ESLint configurations
│   ├── database/       # Database schemas & clients (placeholder)
│   ├── shared/         # Common utilities & types (placeholder)
│   └── ui/             # Shared React UI components (placeholder)
├── supabase/           # Supabase infrastructure & migrations (placeholder)
└── docs/               # Architecture & system documentation
```

## Folder Overview

- **`apps/web`**: Next.js 16 web application utilizing App Router, Tailwind CSS v4, and React 19.
- **`packages/config`**: Core shared configuration package containing base TypeScript and ESLint configurations consumed across all monorepo packages.
- **`packages/ui`**: Shared UI component package scaffolded for design system components.
- **`packages/database`**: Data model definition, ORM clients, and database schema package.
- **`packages/shared`**: Shared type definitions, constants, validation schemas, and utility functions.
- **`supabase`**: Local and cloud Supabase backend config, migrations, and seed scripts.
- **`docs`**: Technical design docs, architecture decisions, and developer onboarding instructions.

## Quick Start

### Prerequisites

- **Node.js**: Version 24 LTS (or >=20.0.0)
- **pnpm**: `pnpm` (or `npx pnpm`)

### Installation

```bash
pnpm install
```

### Development

Run all applications and packages in development mode:

```bash
pnpm dev
```

### Monorepo Tasks

```bash
pnpm build      # Build all apps and packages
pnpm lint       # Lint all codebase packages
pnpm type-check # Run TypeScript compiler check across all packages
pnpm format     # Format code using Prettier
```
