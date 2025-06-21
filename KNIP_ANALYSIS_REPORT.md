# Knip Unused Code Analysis Report

## Overview

This report documents the results of running knip on the Flexile codebase to identify unused code, exports, and dependencies. The analysis was performed using `npx knip` with a custom configuration targeting the TypeScript/Next.js frontend code.

## Configuration

Knip was configured to analyze:
- **Entry points**: Next.js app router pages, layouts, API routes, tRPC server and routes, middleware, and configuration files
- **Project scope**: All TypeScript files in `frontend/` directory and e2e tests
- **Exclusions**: Ruby backend code, build artifacts, generated files, and node_modules

## Summary of Findings

- **92 unused files** - Files that are not imported or referenced anywhere
- **130 unused exports** - Functions, components, and variables that are exported but never imported
- **7 unused exported types** - TypeScript type definitions that are exported but unused
- **5 configuration hints** - Suggestions for improving the knip configuration

## Detailed Findings

### Unused Files (92 total)
The analysis identified 92 files that appear to be unused. These include:
- Build artifacts and generated files
- Potentially obsolete components or utilities
- Test files that may no longer be needed

### Unused Exports (130 total)

#### E2E Test Factories (23 unused exports)
Many test factory functions in the `e2e/factories/` directory are exported but not used:
- `companiesFactory`, `companyAdministratorsFactory`, `companyContractorsFactory`
- `documentsFactory`, `equityGrantsFactory`, `invoicesFactory`
- `usersFactory`, `wiseRecipientsFactory`
- And 15+ more factory functions

#### E2E Test Helpers (12 unused exports)
Test helper functions that are exported but unused:
- `clearClerkUser`, `setClerkUser`, `login` (auth helpers)
- `startsOn`, `endsOn` (date helpers)
- `mockDocuseal`, `selectComboboxOption`, `fillDatePicker`
- `test`, `expect`, `withinModal` (test utilities)

#### Next.js Page Components (50+ unused exports)
Many Next.js page components export default functions that may not be properly connected:
- Auth pages: `frontend/app/(auth)/login/[[...rest]]/page.tsx`
- Marketing pages: `frontend/app/(marketing)/page.tsx`
- Administrator settings pages
- Equity management pages
- Invoice management pages
- Document management pages

#### tRPC Exports (15+ unused exports)
Several tRPC-related exports are unused:
- `createContext`, `baseProcedure`, `protectedProcedure`, `companyProcedure`
- Router exports: `capTableRouter`, `companiesRouter`, `filesRouter`
- Utility functions: `renderTiptap`, `calculateInvoiceEquity`

#### Configuration and Middleware (5 unused exports)
- `default` exports from config files: `drizzle.config.js`, `middleware.ts`, `next.config.ts`
- `config` export from middleware
- `maxDuration` from API route

### Unused Exported Types (7 total)
TypeScript type definitions that are exported but not imported:
- `Context`, `ProtectedContext`, `CompanyContext` (tRPC context types)
- `RouterInput`, `RouterOutput` (tRPC router types)
- `EquityGrant`, `User` (domain model types)

### Configuration Hints (5 total)
Knip suggests these configuration improvements:
- Remove `eslint.config.js` and `playwright.config.ts` from entry points
- Remove them from project files as well
- Add or refine workspace configuration for better analysis

## Recommendations

### Immediate Actions
1. **Review E2E Test Factories**: Many test factories are unused and could be removed if they're truly obsolete
2. **Audit Next.js Pages**: Verify that page components marked as unused are actually accessible via routing
3. **Clean Up tRPC Exports**: Remove unused tRPC utilities and router exports
4. **Remove Unused Types**: Clean up TypeScript type exports that aren't being used

### Caution Areas
1. **Next.js Pages**: Some "unused" page exports might be false positives due to Next.js file-based routing
2. **Test Utilities**: Some test helpers might be used in ways knip doesn't detect
3. **Configuration Files**: Config file exports might be used by build tools in ways not visible to knip

### Process Improvements
1. **Regular Knip Runs**: Integrate knip into CI/CD to catch unused code early
2. **Refined Configuration**: Update knip config based on the hints provided
3. **Team Guidelines**: Establish practices for removing unused exports when refactoring

## Usage Instructions

To run this analysis again:

```bash
# Run knip analysis
npx knip

# Run with specific configuration
npx knip --config knip.config.ts
```

The knip configuration is stored in `knip.config.ts` at the project root.

## Notes

- This analysis focused on the TypeScript/JavaScript frontend code only
- Ruby backend code was excluded as knip is designed for JavaScript/TypeScript projects
- Some findings may be false positives and should be verified before removal
- The analysis helps identify potential cleanup opportunities but requires human judgment for safe removal
