import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { productApi } from '../services/productApi';
import { sortOptions, priceFilters } from '../constants/products';
import type { Product } from '../types/product';

interface ProductsContextType {
  // Data
  products: Product[];
  categories: Array<{ id: string; name: string; count: number }>;
  sortOptions: typeof sortOptions;
  priceFilters: typeof priceFilters;
  
  // Filters
  selectedCategory: string;
  selectedSort: string;
  selectedPriceFilter: string;
  searchQuery: string;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  setSelectedCategory: (category: string) => void;
  setSelectedSort: (sort: string) => void;
  setSelectedPriceFilter: (priceFilter: string) => void;
  setSearchQuery: (query: string) => void;
  toggleLike: (productId: string) => void;
  loadProducts: () => Promise<void>;
  loadCategories: () => Promise<void>;
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
  setCurrentPage: (page: number) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

interface ProductsProviderProps {
  children: ReactNode;
}

export function ProductsProvider({ children }: ProductsProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load categories from API
  const loadCategories = React.useCallback(async () => {
    try {
      const response = await productApi.getCategories();
      setCategories(response.categories || response);
    } catch (err) {
      console.error('Failed to load categories:', err);
      // Fallback to empty categories if API fails
      setCategories([]);
    }
  }, []);

  // Load products from API
  const loadProducts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const priceFilter = priceFilters.find(f => f.value === selectedPriceFilter);
      const filters = {
        category: selectedCategory,
        search: searchQuery.trim() || undefined,
        minPrice: priceFilter?.min,
        maxPrice: priceFilter?.max,
        sortBy: selectedSort,
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await productApi.getProducts(filters);
      setProducts(response.products);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSort, selectedPriceFilter, searchQuery, currentPage]);

  // Load categories on mount
  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Load products when filters change
  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSort, selectedPriceFilter, searchQuery]);

  const toggleProductLike = (productId: string) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, isLiked: !product.isLiked }
          : product
      )
    );
  };

  const value: ProductsContextType = {
    // Data
    products,
    categories,
    sortOptions,
    priceFilters,
    
    // Filters
    selectedCategory,
    selectedSort,
    selectedPriceFilter,
    searchQuery,
    
    // State
    loading,
    error,
    
    // Actions
    setSelectedCategory,
    setSelectedSort,
    setSelectedPriceFilter,
    setSearchQuery,
    toggleLike: toggleProductLike,
    loadProducts,
    loadCategories,
    
    // Pagination
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    setCurrentPage
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}