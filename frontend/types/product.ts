export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  downloads: number;
  views: number;
  category: string;
  author: string;
  authorId: string;
  imageUrl?: string;
  isPro: boolean;
  featured: boolean;
  tags: string[];
  status: string;
  fileUrls: string[];
  fileSizes: number[];
  licenseType?: string;
  createdAt: string;
  updatedAt: string;
  
  // Keep these for compatibility
  isPremium?: boolean;
  isActive?: boolean;
  sellerId?: string;
  version?: string;
  reviews?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface PriceFilter {
  value: string;
  label: string;
  min?: number;
  max?: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}