import { useState, useEffect } from 'react'
import { getProducts, getCategories, getCart } from './api'
import './App.css'

function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [productsData, categoriesData, cartData] = await Promise.all([
        getProducts(),
        getCategories(),
        getCart(),
      ])
      setProducts(productsData)
      setCategories(categoriesData)
      setCart(cartData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory)

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading amazing products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header glass">
        <div className="container">
          <div className="header-content">
            <h1 className="logo">
              <span className="logo-icon">🛍️</span>
              Symulate Shop
            </h1>
            <button className="cart-button" onClick={() => setShowCart(!showCart)}>
              <span className="cart-icon">🛒</span>
              <span className="cart-badge">{cartItemCount}</span>
              <span className="cart-text">${cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Categories */}
      <section className="categories-section">
        <div className="container">
          <div className="categories">
            <button
              className={`category-chip ${selectedCategory === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('All')}
            >
              All Products
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-chip ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="container">
        <div className="products-grid">
          {filteredProducts.map(product => (
            <article key={product.id} className="product-card glass">
              <div className="product-image">
                <img src={`https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} />
                {product.inStock && <span className="stock-badge">In Stock</span>}
              </div>
              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-footer">
                  <div className="product-rating">
                    {'⭐'.repeat(Math.round(parseFloat(product.rating) % 5 || 4))}
                  </div>
                  <div className="product-price">${parseFloat(product.price).toFixed(2)}</div>
                </div>
                <button className="add-to-cart-button">
                  Add to Cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <aside className="cart-sidebar glass" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Shopping Cart</h2>
              <button className="close-button" onClick={() => setShowCart(false)}>✕</button>
            </div>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={`https://picsum.photos/seed/${item.productId}/100/100`} alt={item.name} />
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p className="cart-item-price">${parseFloat(item.price).toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div className="cart-item-total">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total:</span>
                <span className="total-amount">${cartTotal.toFixed(2)}</span>
              </div>
              <button className="checkout-button">Checkout</button>
            </div>
          </aside>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            Powered by <strong>Symulate SDK</strong> - AI-powered mock data generation
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
