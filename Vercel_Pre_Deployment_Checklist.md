# Pre-Deployment Checklist & AI Prompt

## Copy-Paste Prompt for AI Assistant

```
Before deploying to Vercel, please perform a comprehensive pre-deployment check:

1. RUN LOCAL BUILD TEST
   - Execute `npm run build` and verify it completes successfully
   - Check for any TypeScript errors in the build output
   - Test the production build with `npm run start`

2. TYPESCRIPT TYPE SAFETY CHECK
   - Scan all files for `unknown` types that need type guards
   - Verify all type predicates return explicit boolean values
   - Check that all generic types have proper constraints
   - Ensure all React hooks (useRef, useState, etc.) have proper type annotations and initial values
   - Look for any `any` types that should be properly typed

3. CLIENT-SIDE CODE VALIDATION
   - Identify all code that uses browser-only APIs (window, document, localStorage, etc.)
   - Verify these are wrapped in `typeof window !== 'undefined'` checks
   - Check that client-side libraries (like InstantDB) use lazy initialization
   - Ensure no module-level code executes client-side-only logic

4. ENVIRONMENT VARIABLE AUDIT
   - List all environment variables used in the codebase
   - Verify they're all set in Vercel project settings
   - Check that code gracefully handles missing env vars during build
   - Ensure no module-level code throws errors if env vars are missing

5. NEXT.JS RENDERING STRATEGY
   - Identify pages that should NOT be statically generated
   - Add `'use client'` directive to client-only components
   - Create layout.tsx files with `export const dynamic = 'force-dynamic'` for dynamic route segments
   - Verify API routes have proper dynamic configuration if needed

6. CONFIGURATION CONFLICTS
   - Check next.config.ts for conflicting options
   - Verify no packages are in both `serverExternalPackages` and `optimizePackageImports`
   - Review experimental features for compatibility

7. FINAL VERIFICATION
   - Run `npx tsc --noEmit` to check for type errors
   - Test all critical user flows in production build
   - Verify all API routes work correctly

Report any issues found and suggest fixes before deployment.
```

---

## Quick Reference: Common Fixes

### Fix 1: Type Guard for Unknown Types

```typescript
// ❌ BAD
filtered.filter(item => item.value >= threshold)

// ✅ GOOD
filtered.filter(item => {
  const value = item.value;
  return typeof value === 'number' && value >= threshold;
})
```

### Fix 2: Type Predicate Boolean Return

```typescript
// ❌ BAD
.filter((item: unknown): item is MyType => {
  return (
    item &&
    typeof (item as MyType).id === 'string'
  );
})

// ✅ GOOD
.filter((item: unknown): item is MyType => {
  const isValid = (
    item &&
    typeof (item as MyType).id === 'string'
  );
  return Boolean(isValid);
})
```

### Fix 3: Lazy Client-Side Initialization

```typescript
// ❌ BAD - Runs during build
const client = initializeClient();
export { client };

// ✅ GOOD - Only runs in browser
let _client: ClientType | null = null;

export function getClient() {
  if (typeof window === 'undefined') {
    throw new Error('Client-side only');
  }
  if (!_client) {
    _client = initializeClient();
  }
  return _client;
}
```

### Fix 4: Force Dynamic Rendering

```typescript
// app/admin/layout.tsx
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### Fix 5: React Hook Type Safety

```typescript
// ❌ BAD
const timeoutRef = useRef<NodeJS.Timeout>();

// ✅ GOOD
const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
```

---

## Pre-Deployment Command Sequence

```bash
# 1. Type check
npx tsc --noEmit

# 2. Build test
npm run build

# 3. Test production build locally
npm run start

# 4. If all pass, commit and push
git add -A
git commit -m "Pre-deployment validation passed"
git push origin main
```

---

## Vercel Environment Variables Checklist

Before deploying, ensure these are set in Vercel:

- [ ] `NEXT_PUBLIC_INSTANT_APP_ID` - InstantDB app ID
- [ ] `INSTANT_ADMIN_TOKEN` - InstantDB admin token
- [ ] Any other `NEXT_PUBLIC_*` variables used in client code
- [ ] Any server-side environment variables used in API routes

**How to set**: Vercel Dashboard → Project → Settings → Environment Variables

---

## Red Flags to Watch For

🚩 **Module-level code that uses `process.env`**

- Move to runtime functions or provide fallback values

🚩 **`typeof window` checks without proper guards**

- Always wrap in conditionals, never assume browser context

🚩 **Generic types with `unknown` properties**

- Add type guards before accessing properties

🚩 **Client components importing server-only code**

- Separate client and server logic properly

🚩 **API routes without `export const dynamic = 'force-dynamic'`**

- Add if the route uses dynamic data

🚩 **Pages that should be dynamic but aren't marked**

- Add layout.tsx with dynamic config

---

## Emergency Fixes

If build fails on Vercel:

1. **Check the error message carefully** - It will point to the exact file and line
2. **Search for the pattern** in this checklist
3. **Apply the corresponding fix**
4. **Test locally with `npm run build`** before pushing
5. **Push and monitor the new deployment**

---

## Success Criteria

✅ `npm run build` completes without errors  
✅ `npx tsc --noEmit` shows no type errors  
✅ Production build runs locally with `npm run start`  
✅ All environment variables are set in Vercel  
✅ No client-side code executes during build  
✅ All dynamic routes are properly configured  

When all criteria are met, deployment should succeed! 🚀
