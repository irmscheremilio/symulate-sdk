# SDK Build Configuration

The SDK uses separate environment files to ensure production credentials are always used in builds while allowing local testing with test credentials.

## Environment Files

### `.env.production` (Committed to Git)
Contains production Supabase credentials that are **baked into the build** at compile time.

```env
SYMULATE_PLATFORM_URL=https://platform.symulate.dev
SYMULATE_SUPABASE_URL=https://ptrjfelueuglvsdsqzok.supabase.co
SYMULATE_SUPABASE_ANON_KEY=<production-key>
```

**When Used:**
- During `npm run build`
- During `npm publish`
- Always produces production builds

### `.env.local` (Not Committed - Local Only)
Optional file for **runtime overrides** during local SDK development and testing.

```env
# .env.local (for local testing)
SYMULATE_SUPABASE_URL=http://localhost:54321
SYMULATE_SUPABASE_ANON_KEY=<local-test-key>
```

**When Used:**
- At runtime via `platformConfig.ts` fallback logic
- Does NOT affect build output
- Useful for testing the SDK against a local Supabase instance

## How It Works

### Build Time (Uses `.env.production`)
```
tsup.config.ts
  ↓ loads .env.production
  ↓ reads SYMULATE_SUPABASE_URL, etc.
  ↓ uses `define` to replace process.env values
  ↓ production credentials baked into dist/
```

### Runtime (Can use `.env.local` override)
```
platformConfig.ts
  ↓ checks process.env.SYMULATE_SUPABASE_URL
  ↓ falls back to PROD_SUPABASE_URL constant
  ↓ .env.local overrides only work at runtime
```

## Build Commands

### `npm run build` (Production Build)
Uses `.env.production` to build with production Supabase credentials.
```bash
npm run build
# → Injects credentials from .env.production
# → Creates dist/ with production URLs
```

### `npm run build:local` (Testing Build)
Uses `.env.local` to build with test/local Supabase credentials.
```bash
npm run build:local
# → Injects credentials from .env.local
# → Creates dist/ with test URLs for local development
```

### `npm run dev` (Watch Mode with Local Credentials)
Watches for changes and rebuilds with `.env.local` credentials.
```bash
npm run dev
# → Injects credentials from .env.local
# → Watches files and rebuilds on change
# → Perfect for local SDK development
```

## Benefits

✅ **Consistent Production Builds** - `npm run build` always uses production credentials
✅ **Easy Local Testing** - `npm run build:local` uses test credentials
✅ **No Manual Steps** - No scripts needed to move files around
✅ **Safe Publishing** - `npm publish` always uses production build

## Legacy Scripts

The `prepare-publish.js` and `restore-env.js` scripts are no longer used. The new approach using `.env.production` and separate build configs is simpler and more reliable.
