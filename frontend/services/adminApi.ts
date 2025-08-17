import { apiClient } from './api';
import type { User } from '../types/auth';
import type { Product } from '../types/product';

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export const adminApi = {
  // Get admin dashboard stats
  async getStats(): Promise<AdminStats> {
    return apiClient.get('/admin/stats');
  },

  // Get all users for management
  async getUsers(): Promise<User[]> {
    return apiClient.get('/admin/users');
  },

  // Update user role
  async updateUserRole(userId: string, role: 'buyer' | 'seller' | 'admin'): Promise<User> {
    return apiClient.put(`/admin/users/${userId}/role`, { role });
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete(`/admin/users/${userId}`);
  },

  // Get all products for review
  async getProducts(): Promise<Product[]> {
    return apiClient.get('/admin/products');
  },

  // Update product status
  async updateProductStatus(productId: string, status: 'pending' | 'approved' | 'rejected'): Promise<Product> {
    return apiClient.put(`/admin/products/${productId}/status`, { status });
  },

  // Delete product
  async deleteProduct(productId: string): Promise<void> {
    return apiClient.delete(`/admin/products/${productId}`);
  },
};