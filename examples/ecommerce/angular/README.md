# Symulate Angular E-Commerce Example

A premium luxury e-commerce application built with Angular 18 and Symulate SDK, featuring sophisticated glassy design and elegant red gradient theme.

## Features

- 🅰️ Angular 18 with standalone components
- 💎 Luxury glassy morphism design
- 🎨 Elegant red gradient theme
- ⭐ Customer reviews showcase
- 📦 Advanced category filtering
- 🔄 Grid/List view toggle
- 📊 Multiple sort options
- 📱 Fully responsive
- ⚡ Powered by Symulate SDK

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm start
```

3. Open your browser to `http://localhost:4200`

## How It Works

This Angular 18 application demonstrates advanced features with Symulate SDK:

- **Products**: 18 luxury products with detailed information
- **Categories**: 6 luxury product categories
- **Reviews**: 5 customer testimonials
- **View Modes**: Switch between grid and list layouts
- **Sorting**: Sort by name, price, or rating

The SDK uses Faker mode for consistent, deterministic data generation.

## Symulate SDK Configuration

```typescript
configureSymulate({
  symulateApiKey: 'demo_key_angular',
  generateMode: 'faker',
  fakerSeed: 99999,
  environment: 'development',
  cacheEnabled: true,
})
```

## Tech Stack

- Angular 18 (Standalone Components)
- TypeScript
- Symulate SDK
- CSS3 (Advanced glass morphism)

## Design Highlights

- Premium glassy cards with deep blur
- Animated product hover effects
- Quick view overlay on hover
- Responsive grid/list layouts
- Customer review carousel
- Sophisticated typography
- Smooth transitions throughout

## Project Structure

```
src/
├── app/
│   ├── api.service.ts       # Symulate SDK integration
│   ├── app.component.ts     # Main component logic
│   ├── app.component.html   # Template
│   └── app.component.css    # Styles
├── main.ts                   # App bootstrap
└── styles.css               # Global styles
```
