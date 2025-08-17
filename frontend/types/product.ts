export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  author: string;
  category: string;
  tags: string[];
  downloadUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  documentation?: string;
  version: string;
  fileSize?: string;
  downloads: number;
  rating: number;
  reviews: number;
  isPremium: boolean;
  isActive: boolean;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
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