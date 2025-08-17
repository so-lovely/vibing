export interface Product {
  id: string;
  title: string;
  imageUrl: string;
  author: string;
}

export interface PurchaseHistoryItem {
  id: string;
  purchaseDate: string;
  price: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'cancelled';
  orderId: string;
  paymentMethod: string;
  product: Product;
  downloadUrl?: string;
  licenseKey?: string;
}

export interface PurchaseHistoryResponse {
  purchases: PurchaseHistoryItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  expiresAt: string;
}

export interface LicenseResponse {
  licenseKey: string;
  message: string;
}

export interface PurchaseStatsResponse {
  stats: {
    totalPurchases: number;
    completedPurchases: number;
    totalSpent: number;
  };
}

export interface PurchaseStatusResponse {
  purchased: boolean;
  purchaseId?: string;
  licenseKey?: string;
  downloadUrl?: string;
}