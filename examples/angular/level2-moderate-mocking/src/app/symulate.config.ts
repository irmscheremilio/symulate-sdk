import { configureSymulate } from '@symulate/sdk';

// ============================================
// SYMULATE SDK CONFIGURATION
// ============================================
// Configure the SDK once at application startup

configureSymulate({
  environment: 'development',
  generateMode: 'faker', // Use 'faker' for offline/free mode, 'ai' for smarter generation
  // Uncomment for AI mode (requires API key):
  // openaiApiKey: 'sk-...',
  // OR use Symulate Platform:
  // symulateApiKey: 'sym_live_...',
  // projectId: 'your-project-id'
});
