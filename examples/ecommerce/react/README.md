# Symulate React E-Commerce Example

A modern, beautiful e-commerce application built with React and Symulate SDK featuring glassy morphism design and gradient backgrounds.

## Features

- ✨ Modern glassy UI design
- 🎨 Beautiful gradient backgrounds
- 🛍️ Product catalog with categories
- 🛒 Shopping cart sidebar
- 📱 Fully responsive
- ⚡ Powered by Symulate SDK for mock data

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown (usually `http://localhost:5173`)

## How It Works

This example uses the Symulate SDK to generate realistic mock e-commerce data without needing a backend:

- **Products**: 12 tech products with names, descriptions, prices, and images
- **Categories**: 6 product categories for filtering
- **Cart**: Shopping cart with 3 sample items

The SDK is configured to use Faker mode with a seed for deterministic data generation, perfect for demos and development.

## Symulate SDK Configuration

```javascript
configureSymulate({
  symulateApiKey: 'demo_key_react',
  generateMode: 'faker',
  fakerSeed: 12345,
  environment: 'development',
  cacheEnabled: true,
})
```

## Tech Stack

- React 18
- Vite
- Symulate SDK
- CSS3 (Glass morphism)
