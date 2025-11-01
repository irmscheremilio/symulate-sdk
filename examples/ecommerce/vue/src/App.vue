<template>
  <div class="app">
    <!-- Header -->
    <header class="header glass">
      <div class="container">
        <div class="header-content">
          <h1 class="logo">
            <span class="logo-icon">✨</span>
            Vue Store
          </h1>
          <div class="header-actions">
            <button class="search-button glass-button">
              <span>🔍</span>
              Search
            </button>
            <button class="wishlist-button glass-button">
              <span>❤️</span>
              <span class="badge">5</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Discovering amazing products...</p>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Featured Deals Banner -->
      <section class="deals-banner">
        <div class="container">
          <h2 class="deals-title">🔥 Flash Deals</h2>
          <div class="deals-grid">
            <div
              v-for="deal in featuredDeals"
              :key="deal.id"
              class="deal-card glass"
            >
              <div class="deal-discount">-{{ Math.round(parseFloat(deal.discount) % 50 || 25) }}%</div>
              <h3 class="deal-title">{{ deal.title }}</h3>
              <button class="deal-button">Shop Now</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section class="categories-section">
        <div class="container">
          <h2 class="section-title">Shop by Category</h2>
          <div class="categories-grid">
            <button
              v-for="category in categories"
              :key="category.id"
              class="category-card glass"
              :class="{ active: selectedCategory === category.name }"
              @click="selectedCategory = category.name"
            >
              <div class="category-icon">📦</div>
              <h3 class="category-name">{{ category.name }}</h3>
              <p class="category-count">{{ Math.round(parseFloat(category.productCount) % 100 || 20) }} items</p>
            </button>
            <button
              class="category-card glass"
              :class="{ active: selectedCategory === null }"
              @click="selectedCategory = null"
            >
              <div class="category-icon">🌟</div>
              <h3 class="category-name">All Products</h3>
              <p class="category-count">{{ products.length }} items</p>
            </button>
          </div>
        </div>
      </section>

      <!-- Products -->
      <section class="products-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">
              {{ selectedCategory || 'All Products' }}
            </h2>
            <div class="product-count">
              {{ filteredProducts.length }} products
            </div>
          </div>
          <div class="products-grid">
            <article
              v-for="product in filteredProducts"
              :key="product.id"
              class="product-card glass"
            >
              <div class="product-image-wrapper">
                <img
                  :src="`https://picsum.photos/seed/${product.id}/500/400`"
                  :alt="product.name"
                  class="product-image"
                />
                <button class="wishlist-icon">❤️</button>
                <span v-if="product.inStock" class="stock-badge">
                  ✓ In Stock
                </span>
              </div>
              <div class="product-content">
                <div class="product-meta">
                  <span class="product-category">{{ product.category }}</span>
                  <div class="product-rating">
                    {{ '⭐'.repeat(Math.round(parseFloat(product.rating) % 5 || 4)) }}
                  </div>
                </div>
                <h3 class="product-title">{{ product.name }}</h3>
                <p class="product-description">{{ product.description }}</p>
                <div class="product-footer">
                  <div class="product-price">
                    ${{ parseFloat(product.price).toFixed(2) }}
                  </div>
                  <button class="add-button">
                    <span>+</span>
                    Add
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </template>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p class="footer-text">
          Built with <span class="heart">💚</span> using
          <strong>Vue 3</strong> & <strong>Symulate SDK</strong>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getProducts, getCategories, getFeaturedDeals } from './api'

const products = ref([])
const categories = ref([])
const featuredDeals = ref([])
const loading = ref(true)
const selectedCategory = ref(null)

const filteredProducts = computed(() => {
  if (!selectedCategory.value) return products.value
  return products.value.filter(p => p.category === selectedCategory.value)
})

async function loadData() {
  try {
    loading.value = true
    const [productsData, categoriesData, dealsData] = await Promise.all([
      getProducts(),
      getCategories(),
      getFeaturedDeals(),
    ])
    products.value = productsData
    categories.value = categoriesData
    featuredDeals.value = dealsData
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import './styles.css';
</style>
