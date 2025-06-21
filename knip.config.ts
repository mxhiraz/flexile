import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  workspaces: {
    '.': {
      entry: [
        'frontend/app/**/page.{ts,tsx}',
        'frontend/app/**/layout.{ts,tsx}',
        'frontend/app/**/error.{ts,tsx}',
        'frontend/app/**/not-found.{ts,tsx}',
        'frontend/app/**/route.{ts,tsx}',
        'frontend/middleware.ts',
        'frontend/trpc/server.ts',
        'frontend/trpc/routes/**/*.ts',
        'frontend/next.config.ts',
        'frontend/drizzle.config.js',
        'e2e/**/*.ts',
        'eslint.config.js',
        'playwright.config.ts',
      ],
      project: [
        'frontend/**/*.{ts,tsx}',
        'e2e/**/*.ts',
        'eslint.config.js',
        'playwright.config.ts',
      ],
      ignore: [
        'frontend/.next/**',
        'apps/next/.next/**',
        'frontend/utils/routes.*',
        'backend/**',
        'apps/rails/**',
        'node_modules/**',
        'test-results/**',
        'playwright-report/**',
        'patches/**',
        'certificates/**',
        'docker/**',
      ],
    },
  },
  includeEntryExports: true,
};

export default config;
