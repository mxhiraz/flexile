# Knip Analysis Findings

## Summary

Ran `npx knip` to analyze the Flexile codebase for unused code. The analysis identified 675 unused files, but investigation revealed that most are false positives due to knip's limitations in detecting usage patterns in this monorepo setup.

## Key Findings

### False Positives Identified

1. **E2E Test Infrastructure** - Files marked as unused but heavily used:

   - `e2e/db.ts` - Imported in 42+ test files
   - `e2e/index.ts` - Imported in 25+ test files
   - `e2e/factories/*.ts` - Factory files used extensively in tests
   - `e2e/helpers/*.ts` - Helper functions used across test suite

2. **Frontend Core Files** - Critical files marked as unused:

   - `frontend/global.ts` - Imported in 71+ frontend files (useCurrentUser, useCurrentCompany)
   - `frontend/middleware.ts` - Next.js middleware (used by framework)
   - Various Next.js pages and components used through file-based routing

3. **Dependencies** - Many actually-used dependencies marked as unused:

   - `@clerk/nextjs` - Used in 9+ files for authentication
   - `@aws-sdk/client-s3` - Used in 3+ files for file operations
   - Other core dependencies used throughout the application

4. **Build Artifacts** - 600+ files in `apps/next/.next/` directory:
   - These are Next.js build outputs that should be ignored
   - Not actual source code that can be deleted

## Root Cause Analysis

Knip struggles with this codebase due to:

- Complex monorepo structure with multiple entry points
- Next.js file-based routing patterns
- TypeScript path aliases (`@/`, `@test/`)
- Dynamic imports and framework-specific usage patterns
- Test infrastructure using custom import paths

## Recommendation

**No code should be deleted** based on this knip analysis due to the high false positive rate. The risk of breaking functionality outweighs the potential benefits of removing the small amount of truly unused code that might exist.

## Alternative Approaches

For future unused code detection:

1. Use knip with more specific configuration for this monorepo structure
2. Manual code review focusing on specific areas of concern
3. Use IDE-based unused code detection for smaller scopes
4. Implement usage tracking for critical components

## Verification Commands Used

```bash
npx knip --reporter compact  # Initial analysis
pnpm run lint-fast          # Verified no linting issues
```

The codebase remains in a clean state with no unsafe deletions performed.
