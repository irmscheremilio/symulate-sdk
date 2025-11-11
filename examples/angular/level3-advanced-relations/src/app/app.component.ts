import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import Symulate configuration
import './symulate.config';

// Import collections
import { users, products, orders, orderItems } from './api/collections';

// Import types
import type { User } from './api/schemas/user.schema';
import type { Product } from './api/schemas/product.schema';
import type { Order } from './api/schemas/order.schema';
import type { OrderItem } from './api/schemas/order-item.schema';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  // State
  activeView: 'dashboard' | 'users' | 'products' | 'orders' = 'dashboard';

  // Dashboard stats
  totalUsers = 0;
  totalProducts = 0;
  totalOrders = 0;
  totalRevenue = 0;

  // Data
  recentOrders: any[] = [];
  topProducts: Product[] = [];
  activeUsers: User[] = [];

  // Detail views
  selectedUser: User | null = null;
  userOrders: any[] = [];

  selectedOrder: any = null;
  selectedOrderItems: any[] = [];

  // Loading states
  loading = false;
  error: string | null = null;

  async ngOnInit() {
    await this.loadDashboard();
  }

  async loadDashboard() {
    try {
      this.loading = true;
      this.error = null;

      // Load stats - use list() to get counts
      const usersCount = await users.list({ limit: 1 });
      const productsCount = await products.list({ limit: 1 });
      const ordersCount = await orders.list({ limit: 1 });

      console.log('Users response:', usersCount);
      console.log('Products response:', productsCount);
      console.log('Orders response:', ordersCount);

      this.totalUsers = usersCount?.pagination?.total || 0;
      this.totalProducts = productsCount?.pagination?.total || 0;
      this.totalOrders = ordersCount?.pagination?.total || 0;

      // Load recent orders (with user data via joins)
      const recentOrdersResponse = await orders.list({
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      this.recentOrders = recentOrdersResponse?.data || [];

      // Calculate total revenue
      const allOrders = await orders.list({ limit: 1000 });
      this.totalRevenue = allOrders?.data?.reduce((sum: number, order: any) => sum + order.total, 0) || 0;

      // Load top products
      const productsResponse = await products.list({
        limit: 8,
        sortBy: 'rating',
        sortOrder: 'desc'
      });
      this.topProducts = productsResponse?.data || [];

      // Load active users
      const usersResponse = await users.list({
        limit: 5,
        filter: { isActive: true }
      });
      this.activeUsers = usersResponse?.data || [];

    } catch (err) {
      this.error = 'Failed to load dashboard';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async loadUsers() {
    try {
      this.loading = true;
      this.error = null;
      this.activeView = 'users';

      const response = await users.list({ limit: 50 });
      this.activeUsers = response?.data || [];
    } catch (err) {
      this.error = 'Failed to load users';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async selectUser(userId: string) {
    try {
      this.loading = true;
      this.error = null;

      // Get user details
      const user = await users.get(userId);
      this.selectedUser = user;

      // Get user's orders (with joins)
      const ordersResponse = await orders.list({
        filter: { userId },
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      this.userOrders = ordersResponse?.data || [];

    } catch (err) {
      this.error = 'Failed to load user details';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async selectOrder(orderId: string) {
    try {
      this.loading = true;
      this.error = null;

      // Get order details
      const order = await orders.get(orderId);
      this.selectedOrder = order;

      // Get order items (with nested joins: product data + order.user data)
      const itemsResponse = await orderItems.list({
        filter: { orderId }
      });
      this.selectedOrderItems = itemsResponse?.data || [];

      console.log('Order items with nested joins:', this.selectedOrderItems);
    } catch (err) {
      this.error = 'Failed to load order details';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async loadProducts() {
    try {
      this.loading = true;
      this.error = null;
      this.activeView = 'products';

      const response = await products.list({ limit: 50 });
      this.topProducts = response?.data || [];
    } catch (err) {
      this.error = 'Failed to load products';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async loadOrders() {
    try {
      this.loading = true;
      this.error = null;
      this.activeView = 'orders';

      const response = await orders.list({ limit: 100 });
      this.recentOrders = response?.data || [];
    } catch (err) {
      this.error = 'Failed to load orders';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  goBackToList() {
    if (this.selectedOrder) {
      this.selectedOrder = null;
      this.selectedOrderItems = [];
    } else if (this.selectedUser) {
      this.selectedUser = null;
      this.userOrders = [];
    }
  }

  goToDashboard() {
    this.activeView = 'dashboard';
    this.selectedUser = null;
    this.selectedOrder = null;
    this.userOrders = [];
    this.selectedOrderItems = [];
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled',
    };
    return colors[status] || 'status-default';
  }
}
