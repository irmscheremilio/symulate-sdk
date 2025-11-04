# Symulate SDK - Development Guide

This guide explains how to develop and test the SDK locally without accidentally using production URLs.

## Environment Configuration

The SDK uses **two environment files** and **two build scripts** to allow easy switching between production and test environments:

1. **`.env.production`** - Production Supabase URLs (committed to git)
2. **`.env.local`** - Test/local overrides (gitignored, never committed)

### How It Works

The SDK has two separate build configurations:

**Production Build** (`npm run build`):
- Uses `tsup.config.ts`
- Loads `.env.production`
- Bakes production URLs into the bundle
- Used for npm publishing

**Local/Development Build** (`npm run build:local`):
- Uses `tsup.config.local.ts`
- Loads `.env.local`
- Bakes test/local URLs into the bundle
- Used for local development and testing

Environment variables are **baked into the bundle at build time** using tsup's `define` option. This means:
- ✅ **Use `npm run build:local` for development** - uses test URLs
- ✅ **Use `npm run build` for production** - uses production URLs
- ✅ `.env.local` is gitignored - never accidentally commit test URLs
- ✅ Production URLs stay in `.env.production` - safe defaults
- ✅ No runtime environment variable checking - values are compiled in

## Setup for Local Development

### 1. Create Your Local Configuration

```bash
# Copy the example file
cp .env.example .env.local
```

### 2. Fill In Your Test Credentials

Edit `.env.local` with your test Supabase project credentials:

```bash
# Platform URL (your local web app)
SYMULATE_PLATFORM_URL=http://localhost:3000

# Supabase Test Project
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
SYMULATE_SUPABASE_URL=https://your-test-project.supabase.co
SYMULATE_SUPABASE_ANON_KEY=eyJhbGciOi...your-test-anon-key
```

### 3. Build the SDK for Local Development

```bash
npm run build:local
```

You'll see: `[dotenv] injecting env (3) from .env.local`

This confirms your local environment variables are being loaded and baked into the bundle! ✅

### 4. Test with Angular or Other Projects

The built SDK will now use your test URLs:

```bash
cd ../symulate-angluar-dev
npm start
```

**⚠️ Important**: If Angular is still using old URLs after rebuilding the SDK, clear Angular's cache:

```bash
cd ../symulate-angluar-dev
rm -rf .angular/cache dist
npm start
```

Angular caches compiled modules, so after changing the SDK you need to clear its cache for changes to take effect.

## Available Environment Variables

| Variable | Description | Production Default |
|----------|-------------|-------------------|
| `SYMULATE_PLATFORM_URL` | Platform web app URL | `https://platform.symulate.dev` |
| `SYMULATE_SUPABASE_URL` | Supabase project URL | `https://ptrjfelueuglvsdsqzok.supabase.co` |
| `SYMULATE_SUPABASE_ANON_KEY` | Supabase anonymous key | Production anon key |

## Development Workflow

### Important: Always Use build:local for Development

When developing and testing the SDK locally, always use:

```bash
npm run build:local
```

This ensures the bundle uses your test URLs from `.env.local`. Using `npm run build` will bake in production URLs!

### Testing with Local Supabase

If you're running Supabase locally:

```bash
# Start local Supabase
temp start

# Check your local anon key
temp status
```

Update `.env.local`:
```bash
SYMULATE_PLATFORM_URL=http://localhost:3000
SYMULATE_SUPABASE_URL=http://localhost:54321
SYMULATE_SUPABASE_ANON_KEY=<anon-key-from-temp-status>
```

Then rebuild:
```bash
npm run build:local
```

### Testing with Test Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your test project
3. Go to **Settings → API**
4. Copy the **URL** and **anon/public key**
5. Paste into `.env.local`
6. Rebuild: `npm run build:local`

### Switching Back to Production

To build for production (e.g., before publishing to npm):

```bash
npm run build
```

This uses `.env.production` and ignores `.env.local` completely. You don't need to delete or modify `.env.local`!

## Publishing to npm

Before publishing, use the production build:

```bash
npm run build
npm publish
```

The `prepublishOnly` script automatically runs `npm run build`, which uses production URLs from `.env.production`.

**Important**: The `.gitignore` already excludes `.env.local`, so it won't be committed to git or included in the npm package. You can keep `.env.local` for local development - it won't interfere with production builds.

## Troubleshooting

### "My build still uses production URLs"

Make sure you're using the correct build script:

```bash
# ❌ Wrong - uses production URLs
npm run build

# ✅ Correct - uses local URLs
npm run build:local
```

Also verify `.env.local` exists and has values:
```bash
cat .env.local
```

You should see your custom URLs. If the file doesn't exist, create it:
```bash
cp .env.example .env.local
# Then edit with your values
```

### "Angular still shows old URLs after rebuilding SDK"

After rebuilding the SDK with `npm run build:local`, you need to clear Angular's cache:

```bash
cd ../symulate-angular-dev
rm -rf .angular/cache dist
npm start
```

Angular caches compiled modules, so changes to linked packages require a cache clear.

### "I accidentally committed .env.local"

This shouldn't happen (it's in `.gitignore`), but if it does:
```bash
git rm --cached .env.local
git commit -m "Remove accidentally committed .env.local"
```

### "dotenv not found"

Install it:
```bash
npm install --save-dev dotenv
```

## Technical Details

### How Environment Variables Are Loaded

1. **Build Time**:
   - `npm run build` uses `tsup.config.ts` which loads `.env.production`
   - `npm run build:local` uses `tsup.config.local.ts` which loads `.env.local`
2. **Replacement**: tsup's `define` option replaces `process.env.SYMULATE_*` with actual values
3. **Bundling**: The bundler optimizes expressions and inlines constants
4. **Result**: No runtime environment checks - values are hardcoded in the bundle

### Code Location

- **Configuration**: `src/platformConfig.ts`
- **Production build config**: `tsup.config.ts`
- **Local build config**: `tsup.config.local.ts`
- **Production environment**: `.env.production` (committed)
- **Local environment template**: `.env.example`
- **Your local config**: `.env.local` (gitignored)

## Best Practices

1. ✅ **Always use `npm run build:local` for development** - Never use `npm run build` during local dev
2. ✅ **Keep `.env.local` secret** - Contains your test project credentials
3. ✅ **Use a dedicated test Supabase project** - Don't test against production
4. ✅ **Clear Angular cache after SDK changes** - Run `rm -rf .angular/cache dist` in Angular app
5. ✅ **Use `npm run build` for publishing** - Automatically uses production URLs
6. ✅ **Document your test project** - Keep notes on which Supabase project is for testing

## Questions?

If you need help:
- Check the production defaults in `src/platformConfig.ts`
- Look at `.env.example` for the correct format
- Verify your Supabase credentials in the Supabase Dashboard
