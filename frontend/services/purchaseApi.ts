import { apiClient } from './api';
import type {
  PurchaseHistoryResponse,
  DownloadUrlResponse,
  LicenseResponse,
  PurchaseStatsResponse,
  PurchaseStatusResponse,
} from '../types/purchase';

export const purchaseApi = {
  // Get purchase history with pagination
  async getPurchaseHistory(page = 1, limit = 10): Promise<PurchaseHistoryResponse> {
    return apiClient.get(`/purchase/history?page=${page}&limit=${limit}`);
  },

  // Get secure download URL for a purchase
  async getDownloadUrl(purchaseId: string): Promise<DownloadUrlResponse> {
    return apiClient.get(`/purchase/${purchaseId}/download`);
  },

  // Generate new license key for a purchase
  async generateLicense(purchaseId: string): Promise<LicenseResponse> {
    return apiClient.post(`/purchase/${purchaseId}/generate-license`);
  },

  // Get purchase statistics
  async getPurchaseStats(): Promise<PurchaseStatsResponse> {
    return apiClient.get('/purchase/stats');
  },

  // Check if user has purchased a specific product
  async checkPurchaseStatus(productId: string): Promise<PurchaseStatusResponse> {
    return apiClient.get(`/purchase/status/${productId}`);
  },
};