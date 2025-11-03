#!/usr/bin/env node
/**
 * Post-publish script
 * Restores .env.local after publishing
 */

const fs = require('fs');
const path = require('path');

const envLocal = path.join(__dirname, '..', '.env.local');
const envTemp = path.join(__dirname, '..', '.env.temp');

console.log('🔄 Restoring development environment...');

if (fs.existsSync(envTemp)) {
  fs.renameSync(envTemp, envLocal);
  console.log('✅ .env.local restored - back to development mode');
} else {
  console.log('ℹ️  No .env.local found - nothing to restore');
}
