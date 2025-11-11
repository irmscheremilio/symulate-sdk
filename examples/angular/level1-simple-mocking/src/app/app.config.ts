import { ApplicationConfig } from '@angular/core';
import { provideZoneChangeDetection } from '@angular/core';
import { configureSymulate } from '@symulate/sdk';

// Configure Symulate SDK for Level 1: Simple Mocking
configureSymulate({
  // Use Faker.js mode - no API key needed!
  generateMode: 'faker',

  // Development environment uses mocks
  environment: 'development',

  // Real backend URL (used in production)
  backendBaseUrl: 'https://api.example.com',

  // Enable caching for faster reloads
  cacheEnabled: true,

  // Optional: Use a seed for deterministic data (useful for testing)
  // fakerSeed: 12345,
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true })
  ]
};
