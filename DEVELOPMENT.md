# Symulate SDK - Development Guide

This guide explains how to develop and test the SDK locally without accidentally using production URLs.

## Environment Configuration

The SDK uses **environment variables** to allow testing with local or test Supabase instances, while defaulting to production URLs when deployed.

### How It Works

1. **Production (default)**: Uses hardcoded production URLs in `src/platformConfig.ts`
2. **Development**: Overrides URLs via environment variables in `.env.local`
y
This means:
- ✅ No manual code changes needed between dev and prod
- ✅ `.env.local` is gitignored, so it never gets committed
- ✅ Production builds automatically use production URLs
- ✅ You'll never forget to change URLs back before publishing

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

### 3. Build the SDK

```bash
npm run build
```

You'll see: `[dotenv] injecting env (3) from .env.local`

This confirms your environment variables are being loaded! ✅

### 4. Test with Angular or Other Projects

The built SDK will now use your test URLs:

```bash
cd ../symulate-angluar-dev
npm start
```

## Available Environment Variables

| Variable | Description | Production Default |
|----------|-------------|-------------------|
| `SYMULATE_PLATFORM_URL` | Platform web app URL | `https://platform.symulate.dev` |
| `SYMULATE_SUPABASE_URL` | Supabase project URL | `https://ptrjfelueuglvsdsqzok.supabase.co` |
| `SYMULATE_SUPABASE_ANON_KEY` | Supabase anonymous key | Production anon key |

## Development Workflow

### Testing with Local Supabase

If you're running Supabase locally:

```bash
# Start local Supabase
supabase start

# Check your local anon key
supabase status
```

Update `.env.local`:
```bash
SYMULATE_PLATFORM_URL=http://localhost:3000
SYMULATE_SUPABASE_URL=http://localhost:54321
SYMULATE_SUPABASE_ANON_KEY=<anon-key-from-supabase-status>
```

### Testing with Test Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your test project
3. Go to **Settings → API**
4. Copy the **URL** and **anon/public key**
5. Paste into `.env.local`

### Switching Back to Production

**Option 1: Delete the file**
```bash
rm .env.local
npm run build
```

**Option 2: Comment out the values**
```bash
# Leave empty to use production defaults
# SYMULATE_PLATFORM_URL=
# SYMULATE_SUPABASE_URL=
# SYMULATE_SUPABASE_ANON_KEY=
```

## Publishing to npm

Before publishing, ensure you're using production URLs:

```bash
# Option 1: Delete .env.local
rm .env.local

# Option 2: Temporarily rename it
mv .env.local .env.local.backup

# Build and publish
npm run build
npm publish

# Restore for development
mv .env.local.backup .env.local
```

**Important**: The `.gitignore` already excludes `.env.local`, so it won't be committed to git or included in the npm package.

## Troubleshooting

### "My build still uses production URLs"

Check that `.env.local` exists and has values:
```bash
cat .env.local
```

You should see your custom URLs. If the file doesn't exist, create it:
```bash
cp .env.example .env.local
# Then edit with your values
```

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

1. **Build Time**: `tsup.config.ts` loads `.env.local` via dotenv
2. **Runtime**: `platformConfig.ts` checks `process.env` and `import.meta.env`
3. **Fallback**: If no env vars are set, uses production defaults

### Code Location

- **Configuration**: `src/platformConfig.ts`
- **Build config**: `tsup.config.ts`
- **Environment template**: `.env.example`
- **Your local config**: `.env.local` (gitignored)

## Best Practices

1. ✅ **Always use `.env.local` for testing** - Never modify `platformConfig.ts` directly
2. ✅ **Keep `.env.local` secret** - Contains your test project credentials
3. ✅ **Use a dedicated test Supabase project** - Don't test against production
4. ✅ **Verify before publishing** - Check that `.env.local` is not active
5. ✅ **Document your test project** - Keep notes on which Supabase project is for testing

## Questions?

If you need help:
- Check the production defaults in `src/platformConfig.ts`
- Look at `.env.example` for the correct format
- Verify your Supabase credentials in the Supabase Dashboard
