# Symulate Vue E-Commerce Example

A stunning e-commerce application built with Vue 3 and Symulate SDK, featuring premium glassy design and beautiful gradients.

## Features

- 💚 Modern Vue 3 Composition API
- ✨ Premium glassy morphism design
- 🎨 Beautiful green gradient theme
- 🔥 Flash deals banner
- 📦 Category filtering
- 💎 Premium product showcase
- 📱 Fully responsive
- ⚡ Powered by Symulate SDK

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

This Vue 3 application demonstrates the power of Symulate SDK to generate realistic mock e-commerce data:

- **Products**: 15 premium lifestyle products
- **Categories**: 8 product categories
- **Flash Deals**: 3 featured deals with discounts

The SDK uses Faker mode for fast, deterministic data generation perfect for development and demos.

## Symulate SDK Configuration

```javascript
configureSymulate({
  symulateApiKey: 'demo_key_vue',
  generateMode: 'faker',
  fakerSeed: 54321,
  environment: 'development',
  cacheEnabled: true,
})
```

## Tech Stack

- Vue 3 (Composition API)
- Vite
- Symulate SDK
- CSS3 (Advanced glass morphism)

## Design Highlights

- Glassy cards with backdrop blur
- Animated shine effect on deals
- Smooth hover transitions
- Heartbeat animation on footer
- Responsive grid layouts
