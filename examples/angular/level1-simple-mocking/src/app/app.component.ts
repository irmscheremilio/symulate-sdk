import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getUsers, getProducts, type User, type Product } from './api/endpoints';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <header>
        <h1>Level 1: Simple Endpoint Mocking</h1>
        <p>Basic endpoint mocking with inline configuration</p>
      </header>

      <section>
        <h2>Users ({{ users.length }})</h2>
        <button (click)="loadUsers()" class="btn">Reload Users</button>

        <div *ngIf="loading" class="loading">Loading...</div>

        <div class="grid" *ngIf="!loading">
          <div *ngFor="let user of users" class="card">
            <img [src]="user.avatar || 'https://via.placeholder.com/150'" alt="Avatar" class="avatar">
            <h3>{{ user.name }}</h3>
            <p class="email">{{ user.email }}</p>
            <p class="age">Age: {{ user.age }}</p>
            <p *ngIf="user.bio" class="bio">{{ user.bio }}</p>
            <p *ngIf="!user.bio" class="bio empty">No bio (testing optional fields)</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Products ({{ products.length }})</h2>
        <button (click)="loadProducts()" class="btn">Reload Products</button>

        <div *ngIf="loadingProducts" class="loading">Loading...</div>

        <div class="grid" *ngIf="!loadingProducts">
          <div *ngFor="let product of products" class="card">
            <h3>{{ product.name }}</h3>
            <p class="category">{{ product.category }}</p>
            <p class="price">\${{ product.price.toFixed(2) }}</p>
            <span [class]="'badge ' + (product.inStock ? 'in-stock' : 'out-stock')">
              {{ product.inStock ? 'In Stock' : 'Out of Stock' }}
            </span>
          </div>
        </div>
      </section>

      <footer>
        <h3>Testing Notes:</h3>
        <ul>
          <li>✅ Basic endpoint mocking with Faker.js</li>
          <li>✅ Type-safe API calls</li>
          <li>✅ Optional fields (some users have no bio/avatar)</li>
          <li>✅ Reload to see new generated data</li>
        </ul>
      </footer>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    header {
      text-align: center;
      margin-bottom: 40px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
    }

    h1 { margin: 0; font-size: 2.5em; }
    h2 { color: #333; margin: 30px 0 15px; }

    .btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      margin-bottom: 20px;
    }

    .btn:hover {
      background: #5568d3;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
      font-size: 18px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-bottom: 15px;
    }

    .email {
      color: #667eea;
      font-size: 14px;
    }

    .age {
      color: #666;
      font-size: 14px;
    }

    .bio {
      font-size: 13px;
      color: #555;
      font-style: italic;
      margin-top: 10px;
    }

    .bio.empty {
      color: #999;
    }

    .category {
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .price {
      font-size: 24px;
      font-weight: bold;
      color: #27ae60;
      margin: 10px 0;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .in-stock {
      background: #d4edda;
      color: #155724;
    }

    .out-stock {
      background: #f8d7da;
      color: #721c24;
    }

    footer {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 40px;
    }

    footer ul {
      list-style: none;
      padding: 0;
    }

    footer li {
      padding: 8px 0;
      font-size: 14px;
    }
  `]
})
export class AppComponent implements OnInit {
  users: User[] = [];
  products: Product[] = [];
  loading = false;
  loadingProducts = false;

  ngOnInit() {
    this.loadUsers();
    this.loadProducts();
  }

  async loadUsers() {
    this.loading = true;
    try {
      this.users = await getUsers();
      console.log('Loaded users:', this.users);
      console.log('Note: Some users may have no bio/avatar (testing optional fields)');
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadProducts() {
    this.loadingProducts = true;
    try {
      this.products = await getProducts();
      console.log('Loaded products:', this.products);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.loadingProducts = false;
    }
  }
}
