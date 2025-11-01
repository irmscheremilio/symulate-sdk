import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './api.service';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  category: string;
  inStock: boolean;
  rating: string;
  reviews: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Review {
  id: string;
  author: string;
  rating: string;
  comment: string;
  date: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  reviews: Review[] = [];
  loading = true;
  selectedCategory: string | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'name' | 'price' | 'rating' = 'name';

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      const [products, categories, reviews] = await Promise.all([
        this.apiService.getProducts(),
        this.apiService.getCategories(),
        this.apiService.getReviews(),
      ]);
      this.products = products as Product[];
      this.categories = categories as Category[];
      this.reviews = reviews as Review[];
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      this.loading = false;
    }
  }

  get filteredAndSortedProducts(): Product[] {
    let filtered = this.selectedCategory
      ? this.products.filter((p) => p.category === this.selectedCategory)
      : this.products;

    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'price':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'rating':
          return parseFloat(b.rating) - parseFloat(a.rating);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  selectCategory(category: string | null) {
    this.selectedCategory = category;
  }

  getRatingStars(rating: string): string {
    const stars = Math.round(parseFloat(rating) % 5 || 4);
    return '⭐'.repeat(stars);
  }

  getReviewCount(reviews: string): number {
    return Math.round(parseFloat(reviews) % 100 || 50);
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }
}
