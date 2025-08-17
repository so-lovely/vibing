import { apiClient } from './api';
import type { Product, ProductsResponse } from '../types/product';

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export const productApi = {
  // Get products with filters and pagination
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    if (filters.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.minPrice !== undefined) {
      params.append('minPrice', filters.minPrice.toString());
    }
    if (filters.maxPrice !== undefined) {
      params.append('maxPrice', filters.maxPrice.toString());
    }
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    return apiClient.get(`/products${queryString ? `?${queryString}` : ''}`);
  },

  // Get single product by ID
  async getProduct(id: string): Promise<Product> {
    return apiClient.get(`/products/${id}`);
  },

  // Create new product (sellers only)
  async createProduct(productData: Partial<Product>): Promise<Product> {
    return apiClient.post('/products', productData);
  },

  // Update product
  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    return apiClient.put(`/products/${id}`, productData);
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    return apiClient.delete(`/products/${id}`);
  },

  // Get categories with counts
  async getCategories(): Promise<Array<{ id: string; name: string; count: number }>> {
    return apiClient.get('/products/categories');
  },
};