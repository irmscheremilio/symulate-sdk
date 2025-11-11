import { configureSymulate } from '@symulate/sdk';

// Configure Symulate SDK for development
configureSymulate({
  environment: 'development',
  generateMode: 'faker', // Use 'ai' for more realistic data with your OpenAI key

  // Collection settings
  collections: {
    persistence: {
      mode: 'local', // 'local' to persist across reloads, 'cloud' for production
    },
    eagerLoading: false, // Set to true to load all related collections recursively
  },

  // Optional: Use your own OpenAI API key for AI-generated data
  // openaiApiKey: 'sk-...',

  // Optional: Use Symulate Platform (requires account)
  // symulateApiKey: 'sym_live_...',
  // projectId: 'your-project-id',
});
