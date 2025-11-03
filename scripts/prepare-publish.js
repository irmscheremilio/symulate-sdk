#!/usr/bin/env node
/**
 * Pre-publish script
 * Temporarily moves .env.local to prevent test credentials from being baked into the build
 */

const fs = require('fs');
const path = require('path');

const envLocal = path.join(__dirname, '..', '.env.local');
const envTemp = path.join(__dirname, '..', '.env.temp');

console.log('🔍 Checking for .env.local...');

if (fs.existsSync(envLocal)) {
  console.log('📦 Moving .env.local to .env.temp (will be restored after publish)');
  fs.renameSync(envLocal, envTemp);
  console.log('✅ .env.local temporarily moved');
  console.log('📝 Build will use PRODUCTION settings from platformConfig.ts');
} else {
  console.log('✅ No .env.local found - build will use production settings');
}
